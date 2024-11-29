import { Gtk, Gdk } from "astal/gtk3"
import { bind } from "astal/binding"
import Tray from "gi://AstalTray"
import TrayIcon from "./TrayIcon"
import Embermug from "./Embermug"
import { BluetoothTrayIcon } from "./Bluetooth"
import { WiredTrayIcon, WirelessTrayIcon } from "./Network"
import { ClockTrayIcon } from "./Clock"
import { ListeningIndicator } from "./Audio"

const tray = Tray.get_default()
const embermug = Embermug.get_default()

export function TrayItemIcon(item: Tray.TrayItem) {
  return TrayIcon({
    className: "",
    icon: <icon icon={bind(item, "icon_name").as(String)} />,
    label: bind(item, "title").as(String),
    onButtonReleased: (widget, event) => {
      const [has_button, button] = event.get_button()
      if (!has_button) {
        return
      }

      console.log(`Received button release for ${button}`)

      switch (button) {
        case 1:
          // Left click
          var [has_coords, x, y] = event.get_coords()
          if (!has_coords) {
            x = 0
            y = 0
          }

          console.log(`Activating item ${item.title} at ${x},${y}`)
          item.secondary_activate(x, y)
          break
        case 3:
          // Right click
          // FIXME: This is broken right now
          // const menu = item.create_menu()
          // if (menu === null) {
          //   return
          // }

          // menu.popup_at_widget(widget, Gdk.Gravity.SOUTH_WEST, Gdk.Gravity.NORTH_WEST, event)
          break
      }
    }
  })
}

export default function SystemTray() {
  return <box className="SystemTray">
    {bind(tray, "items").as((items) => items.map(TrayItemIcon))}
    {embermug.create_tray_icon()}
    {BluetoothTrayIcon()}
    {WiredTrayIcon()}
    {WirelessTrayIcon()}
    {ListeningIndicator()}
    {ClockTrayIcon()}
  </box>
}
