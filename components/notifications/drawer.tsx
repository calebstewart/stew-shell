import { bind, Variable } from "astal"
import Binding from "astal/binding"
import { App, Astal, Gtk } from "astal/gtk3"
import Notifd from "gi://AstalNotifd"

import BarItem from "../bar/item"
import { PopupWindow, TogglePopup } from "../popup"
import { DisableNotificationPopup } from "./popup"
import Notification from "./notification"

const notifd = Notifd.get_default()
const emptyNotificationMessages = [
  "Oops, all gone!",
  "Fresh out of ideas.",
  "Nada. Zilch. Zero.",
  "Well, this is awkward.",
  "The dog ate it.",
  "Insert awesome stuff here.",
  "404: List not found.",
  "Crickets... just crickets.",
  "Nothing but tumbleweeds.",
  "Space reserved for greatness.",
  "Shh... it's a secret.",
  "Gone fishing. Try later!",
  "Imaginary friends live here.",
  "Nothing to report, Captain!",
  "The list took a vacation.",
  "Nope, nada, nuh-uh.",
  "Under construction 🚧.",
  "The void stares back.",
  "Invisible list—trust us!",
  "Moved to a parallel universe.",
  "Don't observe me! 🥸",
];

export const NotificationDrawerName = "NotificationDrawer"

export default function SetupNotificationDrawer() {
  const notifications = bind(notifd, "notifications").as(notifications => {
    const items = notifications
      .sort((a, b) => a.time - b.time)
      .map(n => <Notification notification={n} onDismissed={() => n.dismiss()} />)
    if (items.length > 0) {
      return items
    } else {
      const message = emptyNotificationMessages[Math.floor(Math.random() * emptyNotificationMessages.length)]
      return <label className="EmptyNotifications" label={message} />
    }
  })

  return <PopupWindow
    name={NotificationDrawerName}
    className={NotificationDrawerName}
    namespace={NotificationDrawerName}
    application={App}
    anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
    onShow={() => DisableNotificationPopup.set(true)}
    onHide={() => DisableNotificationPopup.set(false)}>
    <box className="Notifications" vertical>
      <centerbox className="header" >
        <label halign={Gtk.Align.START} hexpand label="Notifications" />
        <box expand />
        <button
          halign={Gtk.Align.END}
          className="fa-solid"
          label={"\uf794"}
          onClicked={() => notifd.get_notifications().forEach((n) => n.dismiss())} />
      </centerbox>
      <Gtk.Separator visible />
      <box vertical>
        {notifications}
      </box>
    </box>
  </PopupWindow>
}

export function NotificationDrawerButton() {
  const reveal = Variable(false)
  const notifications = bind(notifd, "notifications")

  return <BarItem
    className={notifications.as((n) => (
      "NotificationDrawer" + (n.length > 0 ? " has-notifications" : "")
    ))}
    onButtonReleaseEvent={(_, event) => {
      const [has_button, button] = event.get_button()
      if (has_button && button === 1) {
        TogglePopup(NotificationDrawerName)
      }
    }}
    reveal={bind(reveal)}>
    <label className="fa-solid" label={"\uf01c"} />
  </BarItem>
}
