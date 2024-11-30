import { bind } from "astal"
import { Gtk } from "astal/gtk3"
import Notifd from "gi://AstalNotifd"

import Notification from "./notification"

const notifd = Notifd.get_default()

const EmptyNotificationMessages = [
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

function RandomMessage() {
  return EmptyNotificationMessages[Math.floor(Math.random() * EmptyNotificationMessages.length)]
}

export interface NotificationListProps {

}

export default function NotificationList({ }: NotificationListProps) {
  return <box className="Notifications" vertical>
    <centerbox className="SettingsMenuHeader" >
      <label halign={Gtk.Align.START} hexpand label="Notifications" />
      <box />
      <box halign={Gtk.Align.END}>
        <button label="Clear" onClicked={() => (
          notifd.get_notifications().forEach((n) => n.dismiss())
        )} />
      </box>
    </centerbox>
    <Gtk.Separator visible />
    <box vertical>
      {bind(notifd, "notifications").as(notifications => {
        const items = notifications
          .sort((a, b) => a.time - b.time)
          .map(n => <Notification notification={n} onDismissed={() => n.dismiss()} />)

        if (items.length > 0) {
          return items
        } else {
          return <label className="EmptyNotifications" label={RandomMessage()} />
        }
      })}
    </box>
  </box>
}
