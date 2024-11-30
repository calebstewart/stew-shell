import { bind } from "astal"
import Tray from "gi://AstalTray"

import BarItem from "./item"

const tray = Tray.get_default()

export function TrayItem(item: Tray.TrayItem) {
  return <BarItem
    className="TrayItem"
    onButtonReleaseEvent={(_widget, event) => {
      const [has_button, button] = event.get_button()
      if (!has_button || button !== 1) {
        return
      }

      const [_has_coords, x, y] = event.get_coords()
      item.activate(x, y)
    }}>
    <icon icon={bind(item, "icon_name").as(String)} />
    <label label={bind(item, "title").as(String)} />
  </BarItem>
}

export default function TrayItems() {
  return bind(tray, "items").as((items) => items.filter((item) => Boolean(item.icon_name)).map(TrayItem))
}
