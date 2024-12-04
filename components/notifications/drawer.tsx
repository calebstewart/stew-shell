import { bind, Variable } from "astal"
import Binding from "astal/binding"
import { Gtk } from "astal/gtk3"
import Notifd from "gi://AstalNotifd"

import BarItem from "../bar/item"

const notifd = Notifd.get_default()

export function NotificationDrawer(notifications: Binding<Gtk.Widget[]>) {
  return <window /> as Gtk.Window
}

export default function NotificationDrawerItem() {
  const reveal = Variable(false)
  const notifications = bind(notifd, "notifications")


  return <BarItem
    className="NotificationDrawer"
    onButtonReleaseEvent={(_, event) => {

    }}
    reveal={bind(reveal)}>
    <label className="fa-solid" label={"\uf1ea"} />
    <label label={notifications.as((notifications) => {
      if (notifications.length === 0) {
        return "No Pending Notifications"
      } else {
        return `${notifications.length} Pending Notifications`
      }
    })} />
  </BarItem>
}
