import { Variable, GObject } from "astal"
import { bind, Subscribable } from "astal/binding"
import { Gdk, Gtk } from "astal/gtk3"
import Bluetooth from "gi://AstalBluetooth"
import TrayIcon from "./TrayIcon"
import { AstalMenu, AstalMenuItem } from "./Builtin"

const bluetooth = Bluetooth.get_default()

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

export function BluetoothTrayIcon() {
  const menu = <AstalMenu className="BluetoothMenu">
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

  const connectedDevices = new ConnectedBluetoothDevices()

  return TrayIcon({
    className: "Bluetooth",
    icon: <icon icon={bind(bluetooth, "is-powered").as((p) => p ? "bluetooth-active" : "bluetooth-disabled")} />,
    label: bind(connectedDevices).as((devices) => {
      if (devices.length == 0) {
        return "Disconnected"
      } else if (devices.length == 1) {
        return devices[0].name
      } else {
        return `${devices.length} Connected`
      }
    }),
    // label: "Bluetooth",
    onDestroy: () => connectedDevices.drop(),
    onButtonReleased: (widget, event) => {
      const [has_button, button] = event.get_button()
      if (!has_button || button != 3) {
        return
      }

      menu.popup_at_widget(widget, Gdk.Gravity.SOUTH_WEST, Gdk.Gravity.NORTH_WEST, event)
    }
  })
}
