import { Astal, App, Gtk } from "astal/gtk3"

import { NotificationList, DisableNotificationPopup } from "../notifications"
import { PopupWindow } from "../popup"
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
  App.toggle_window(SettingsMenuName)
  return App.get_window(SettingsMenuName)?.visible
}

export function HideSettingsMenu() {
  App.get_window(SettingsMenuName)?.hide()
}

export function ShowSettingsMenu() {
  App.get_window(SettingsMenuName)?.show()
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
      <Gtk.Separator visible />
      <NotificationList />
    </box>
  </PopupWindow>
}
