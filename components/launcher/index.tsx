import { Variable, bind } from "astal"
import { Astal, App, Gtk } from "astal/gtk3"
import Apps from "gi://AstalApps"

import { PopupWindow } from "../popup"
import style from "./style/launcher.scss"

// Export a global instance of the application list
export const Applications = Apps.Apps.new()
export const LauncherName = "ApplicationLauncher"

export function IconForClass(apps: Apps.Application[], clazz: string, defaultIcon: string): string {
  if (Astal.Icon.lookup_icon(clazz) !== null) {
    return clazz
  } else {
    return apps.find((app) => app.wm_class === clazz)?.icon_name || defaultIcon
  }
}

export function ToggleLauncherMenu() {
  App.toggle_window(LauncherName)
  return App.get_window(LauncherName)?.visible
}

export function HideLauncherMenu() {
  App.get_window(LauncherName)?.hide()
}

export function Launch(app: Apps.Application) {
  app.launch()
  HideLauncherMenu()
}

export interface ApplicationButtonProps {
  application: Apps.Application
}

export function ApplicationButton({ application }: ApplicationButtonProps) {
  return <button
    className="App"
    onClicked={() => Launch(application)}>
    <box>
      <icon icon={bind(application, "icon_name").as(String)} />
      <box valign={Gtk.Align.CENTER} vertical>
        <label
          className="name"
          truncate
          xalign={0}
          label={bind(application, "name").as(String)} />
        {application.description && <label
          className="description"
          wrap
          xalign={0}
          label={application.description} />}
      </box>
    </box>
  </button>
}

export default function SetupLauncher() {
  const input = Variable("")
  const matching_apps = bind(input).as((text) => Applications.fuzzy_query(text).slice(0, 10))

  return <PopupWindow
    name={LauncherName}
    className={LauncherName}
    namespace={LauncherName}
    application={App}
    visible={false}
    anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT}
    keymode={Astal.Keymode.EXCLUSIVE}
    onShow={() => input.set("")}
    css={style}>
    <box className="Launcher" vertical>
      <entry
        placeholder_text="Search..."
        text={bind(input)}
        onChanged={(e) => input.set(e.text)}
        onActivate={() => {
          const apps = matching_apps.get()
          if (apps.length > 0) {
            HideLauncherMenu()
            Launch(apps[0])
          }
        }} />
      <box spacing={6} vertical>
        {matching_apps.as((apps) => apps.map((app) => (
          <ApplicationButton application={app} />
        )))}
      </box>
      <box
        halign={Gtk.Align.CENTER}
        className="not-found"
        vertical
        visible={matching_apps.as((apps) => apps.length === 0)}>
        <icon icon="system-search-symbolic" />
        <label label="No match found" />
      </box>
    </box>
  </PopupWindow>
}
