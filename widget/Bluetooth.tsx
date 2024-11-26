import { Variable } from "astal"
import { bind } from "astal/binding"
import { Gdk, Gtk } from "astal/gtk3"
import Bluetooth from "gi://AstalBluetooth"
import TrayIcon from "./TrayIcon"
import { AstalMenu, AstalMenuItem } from "./Builtin"

const bluetooth = Bluetooth.get_default()

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

  return TrayIcon({
    className: "Bluetooth",
    icon: <icon icon={bind(bluetooth, "is-powered").as((p) => p ? "bluetooth-active" : "bluetooth-disabled")} />,
    label: "Bluetooth",
    onButtonReleased: (widget, event) => {
      const [has_button, button] = event.get_button()
      if (!has_button || button != 3) {
        return
      }

      menu.popup_at_widget(widget, Gdk.Gravity.SOUTH_WEST, Gdk.Gravity.NORTH_WEST, event)
    }
  })
}
