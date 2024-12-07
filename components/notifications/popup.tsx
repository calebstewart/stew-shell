import { Variable, bind } from "astal"
import { App, Astal } from "astal/gtk3"
import Notifd from "gi://AstalNotifd"
import Hyprland from "gi://AstalHyprland"

import { GetGdkMonitor } from "@components/hyprland"

import style from "./style/popup.scss"
import NotificationCache from "./cache"

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
  const reveal = Variable.derive(
    [bind(DoNotDisturb), bind(DisableNotificationPopup)],
    (dnd, disabled) => {
      return !dnd && !disabled
    }
  )

  // Bind the monitor for the window to the currently focused Hyprland
  // monitor, and map it back to the GDK monitor.
  const gdkmonitor = bind(Hyprland.get_default(), "focused_monitor").as((hm) => (
    GetGdkMonitor(hm)
  ))

  return <window
    name={NotificationPopupName}
    className={NotificationPopupName}
    namespace={NotificationPopupName}
    gdkmonitor={gdkmonitor}
    layer={Astal.Layer.OVERLAY}
    exclusivity={Astal.Exclusivity.NORMAL}
    application={App}
    visible={bind(reveal)}
    anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
    css={style}>
    <box vertical>
      {bind(cache)}
    </box>
  </window>
}
