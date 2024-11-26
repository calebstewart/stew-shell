import { Variable } from "astal"
import { Gtk, Gdk, Astal } from "astal/gtk3"
import Binding, { bind } from "astal/binding"
import NotificationCache from "./NotificationCache"

type Props = {
  GdkMonitor: Gdk.Monitor | Binding<Gdk.Monitor | undefined>,
  SystemMenu: Gtk.Widget,
}

export const DoNotDisturb = Variable(false)

export default function NotificationPopup({ GdkMonitor: Monitor, SystemMenu }: Props) {
  const cache = new NotificationCache()
  const notifications = Variable.derive([cache, DoNotDisturb], (widgets, dnd) => {
    return dnd ? [] : widgets
  })

  const window = <window
    className="NotificationPane"
    gdkmonitor={Monitor}
    exclusivity={Astal.Exclusivity.EXCLUSIVE}
    visible={bind(SystemMenu, "visible").as((v) => !v)}
    onDestroy={() => notifications.drop()}
    anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}>
    <box vertical>
      {bind(notifications)}
    </box>
  </window>

  // Clear the notification cache when the popup is shown. This only happens when 
  // the system menu is shown to make sure don't duplicate notifications while the
  // system menu is open.
  window.connect("show", (_) => cache.clear())

  // Return the window
  return window
}
