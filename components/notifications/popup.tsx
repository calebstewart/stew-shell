import { Variable } from "astal"
import { App, Gtk, Astal } from "astal/gtk3"
import { bind } from "astal/binding"
import Notifd from "gi://AstalNotifd"
import NotificationCache from "./cache"
import { PopupWindow } from "../popup"
import style from "./style/popup.scss"

const notifd = Notifd.get_default()

// Name of the popup window
export const NotificationPopupName = "NotificationPopup"

// User setting to silence all notification popups
export const DoNotDisturb = Variable(false)

// Internal flag controlling the display of notificaton popups.
// This is different from Do Not Distrub. It is primarily used
// to disable popups while the system menu is open, since that
// also displays notification content, and overlaps with the
// popups.
export const DisableNotificationPopup = Variable(false)

export default function SetupNotificationPopup() {
  const cache = new NotificationCache(notifd)
  const reveal = Variable.derive([bind(DoNotDisturb), bind(DisableNotificationPopup)], (dnd, disabled) => {
    return !dnd && !disabled
  })

  return <PopupWindow
    name={NotificationPopupName}
    className={NotificationPopupName}
    namespace={NotificationPopupName}
    application={App}
    visible={bind(cache).as((widgets) => widgets.length > 0)}
    anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
    css={style}>
    <revealer
      reveal_child={bind(reveal)}
      transition_type={Gtk.RevealerTransitionType.SLIDE_DOWN}
      onDestroy={() => reveal.drop()}>
      <box vertical>
        {bind(cache)}
      </box>
    </revealer>
  </PopupWindow>
}
