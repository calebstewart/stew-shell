import { Variable } from "astal"
import { Gtk, Gdk, Astal } from "astal/gtk3"
import Binding, { bind } from "astal/binding"
import NotificationCache from "./NotificationCache"

type Props = {
  GdkMonitor: Gdk.Monitor | Binding<Gdk.Monitor | undefined>,
  SystemMenu: Gtk.Widget,
}

export const DoNotDisturb = Variable(false)
export const HideNotificationPopup = Variable(false)

export default function NotificationPopup(monitor: Gdk.Monitor | Binding<Gdk.Monitor>) {
  const cache = new NotificationCache()
  const notifications = Variable.derive([cache, DoNotDisturb], (widgets, dnd) => {
    return dnd ? [] : widgets
  })

  const unsub = HideNotificationPopup.subscribe((v) => {
    if (!v) {
      cache.clear()
    }
  })

  const window = <window
    className="NotificationPane"
    gdkmonitor={monitor}
    exclusivity={Astal.Exclusivity.EXCLUSIVE}
    visible={bind(HideNotificationPopup).as((v) => !v)}
    onDestroy={() => {
      unsub()
      notifications.drop()
    }}
    anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}>
    <box vertical>
      {bind(notifications)}
    </box>
  </window>

  // Return the window
  return window
}
