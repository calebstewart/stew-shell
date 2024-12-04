import { Astal, App, Gtk } from "astal/gtk3"

import { NotificationList, DisableNotificationPopup } from "../notifications"
import { PopupWindow, TogglePopup, HidePopup, ShowPopup } from "../popup"
import QuickSettings from "./quick-settings"
import AudioControls from "./audio-controls"
import MediaPlayers from "./media-players"
import style from "./style/settings-menu.scss"

export const SettingsMenuName = "SettingsMenu"
export const SettingsMenuCloserName = SettingsMenuName + "Closer"

export function SettingsMenuButton() {
  return <button className="SettingsMenuButton" onClicked={ToggleSettingsMenu}>
    <label className="fa-solid" label={"\uf0c9"} />
  </button>
}

export function ToggleSettingsMenu() {
  return TogglePopup(SettingsMenuName)
}

export function HideSettingsMenu() {
  HidePopup(SettingsMenuName)
}

export function ShowSettingsMenu() {
  ShowPopup(SettingsMenuName)
}

export default function SetupSettingsMenu() {
  return <PopupWindow
    name={SettingsMenuName}
    className={SettingsMenuName}
    namespace={SettingsMenuName}
    application={App}
    visible={false}
    anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
    onShow={() => DisableNotificationPopup.set(true)}
    onHide={() => DisableNotificationPopup.set(false)}
    css={style}>
    <box vertical>
      <QuickSettings />
      <AudioControls />
      <Gtk.Separator visible />
      <MediaPlayers />
    </box>
  </PopupWindow>
}
