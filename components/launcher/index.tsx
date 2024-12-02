import { Variable, bind, Gio, GLib } from "astal"
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

// This is a bit of a hack. It resolves the desktop file, and then
// uses `systemd-run` to invoke `gio launch` to run the desktop
// file. This isn't ideal, but the alternative is having all applications
// started by the launcher tied to the shell process, and dying when the
// shell exits. This is inconvenient in practice, and I havne't found a
// way to get around it using the Gio.DesktopAppInfo interface directly.
//
// The upside is that each application logs it's output to the system
// journal, and we can retroactively inspect those logs easily by
// desktop entry name.
//
// Generally, when an application is launched, it is launched under
// a transient SystemD unit named after it's desktop file with the
// extension ".desktop" replaced with ".service". The service type
// is 'forking' because we using `gio launch` which will fork, exec
// the desktop file, and then exit. We use '--collect', so the service
// will disappear after exiting. If the service failed for some 
// reason, you can inspect the logs with 'journalctl --user --unit "unit-name"'.
export function Launch(app: Apps.Application) {
  var app_info = Gio.DesktopAppInfo.new(app.entry)
  if (app_info === null) {
    app_info = Gio.DesktopAppInfo.new(`${app.entry}.desktop`)
  }
  if (app_info === null) {
    app_info = Gio.DesktopAppInfo.new(app.name)
  }
  if (app_info === null) {
    app_info = Gio.DesktopAppInfo.new(`${app.name}.desktop`)
  }
  if (app_info === null) {
    app_info = app.get_app()
  }

  if (app_info === null) {
    return
  }

  const file = Gio.File.new_for_path(app_info.get_filename()!)
  const basename = (file.get_basename()!).split(".", 2)[0]
  const args = [
    "systemd-run",
    "--user",
    `--unit=${basename}`,
    `--description=${app.get_description()}`,
    "--collect",
    "--same-dir",
    "--service-type=forking",
    "gio", "launch", file.get_path()!,
  ]

  Gio.Subprocess.new(
    args,
    Gio.SubprocessFlags.NONE,
  ).wait(null)
}

export interface ApplicationButtonProps {
  application: Apps.Application
}

export function ApplicationButton({ application }: ApplicationButtonProps) {
  return <button
    className="App"
    onClicked={() => {
      Launch(application)
      HideLauncherMenu()
    }}>
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
