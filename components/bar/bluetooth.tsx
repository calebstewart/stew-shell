import { Variable, bind, timeout } from "astal"
import { Subscribable } from "astal/binding"
import { Gtk, Gdk } from "astal/gtk3"
import Bluetooth from "gi://AstalBluetooth"

import { AstalMenu, AstalMenuItem } from "../builtin"
import BarItem from "./item"

import menu_style from "./style/bluetooth-menu.scss"

const bluetooth = Bluetooth.get_default()

// Subscribable interface for connected devices, which are a subset of all devices
// which are actively connected. Notification happens whenever a device is
// connected or disconnected.
export class ConnectedBluetoothDevices implements Subscribable<Array<Bluetooth.Device>> {
  private devices: Variable<Array<Bluetooth.Device>> = Variable([])
  private subscribers: Array<(devices: Array<Bluetooth.Device>) => void> = new Array()
  private bluetoothUnsub: () => void = () => { }
  private devicesUnsub: () => void = () => { }

  public constructor() {
    this.reset(bluetooth.get_devices())
    this.bluetoothUnsub = bind(bluetooth, "devices").subscribe((devices) => this.reset(devices))
  }

  public drop() {
    this.bluetoothUnsub()
    this.devices.drop()
  }

  public get() {
    return this.devices.get()
  }

  public subscribe(callback: (devices: Array<Bluetooth.Device>) => void) {
    this.subscribers.push(callback)
    callback(this.get())

    return () => {
      this.subscribers.splice(this.subscribers.indexOf(callback), 1)
    }
  }

  private reset(devices: Array<Bluetooth.Device>) {
    this.devicesUnsub()
    this.devices.drop()

    this.devices = Variable.derive(devices.map((d) => bind(d, "connected").as((c) => [d, c])), (...args: any[][]) => args
      .filter(([_device, connected]) => connected)
      .map(([device, _connected]) => {
        return device as Bluetooth.Device
      })
    )
    this.devicesUnsub = bind(this.devices).subscribe((devices) => this.notify(devices))
  }

  private notify(value: Array<Bluetooth.Device>) {
    this.subscribers.forEach((callback) => callback(value))
  }
}

// Create a menu of bluetooth devices allowing the user to connect/disconnect
// the devices at will.
function BluetoothMenu() {
  return <AstalMenu className="BluetoothMenu" css={menu_style}>
    {bind(bluetooth, "devices").as((devices) => devices.map((device) => {
      const icon = Variable.derive([bind(device, "connected"), bind(device, "connecting")], (connected, connecting) => {
        if (connected) {
          return "bluetooth-active"
        } else if (connecting) {
          return "network-wireless-acquiring"
        } else {
          return "bluetooth-disabled"
        }
      })

      return <AstalMenuItem onDestroy={() => icon.drop()} onActivate={() => {
        if (device.connected) {
          device.disconnect_device((_dev, res) => {
            device.disconnect_device_finish(res)
          })
        } else {
          device.connect_device((_dev, res) => {
            device.connect_device_finish(res)
          })
        }
      }}>
        <box>
          <icon icon={bind(icon)} />
          <label label={bind(device, "name").as(String)} />
        </box>
      </AstalMenuItem>
    }))}
  </AstalMenu> as Gtk.Menu
}

export default function BluetoothItem() {
  const menu = BluetoothMenu()
  const devices = new ConnectedBluetoothDevices()
  const reveal = Variable(false)
  const unsubDevices = devices.subscribe((_) => {
    reveal.set(true)
    timeout(3000, () => reveal.set(false))
  })
  const unsubPowered = bind(bluetooth, "is_powered").subscribe((_) => {
    reveal.set(true)
    timeout(3000, () => reveal.set(false))
  })
  const label_text = Variable.derive([devices, bind(bluetooth, "is_powered")], (devices, powered) => {
    if (!powered) {
      return "Disabled"
    } else if (devices.length == 0) {
      return "Disconnected"
    } else if (devices.length == 1) {
      return devices[0].name
    } else {
      return `${devices.length} Connected`
    }
  })

  return <BarItem
    className="Bluetooth"
    reveal={bind(reveal)}
    onDestroy={() => {
      unsubDevices()
      unsubPowered()
      label_text.drop()
      devices.drop()
      menu.destroy()
    }}
    onButtonReleaseEvent={(widget, event) => {
      const [has_button, button] = event.get_button()
      if (!has_button || button != 3) {
        return
      }

      menu.popup_at_widget(widget, Gdk.Gravity.SOUTH_WEST, Gdk.Gravity.NORTH_WEST, event)
    }}>
    <icon icon={bind(bluetooth, "is_powered").as((p) => p ? "bluetooth-active" : "bluetooth-disabled")} />
    <label label={bind(label_text)} />
  </BarItem>
}
