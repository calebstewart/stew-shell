import { Variable, GLib, Gio } from "astal"
import { bind } from "astal/binding"
import { App, Astal, Gtk, Gdk } from "astal/gtk3"
import Apps from "gi://AstalApps"
import PopupCloser from "./Popup"
import { CurrentGdkMonitor } from "./Hyprland"

const Applications = Apps.Apps.new()
const MAX_ITEMS = 10
const LauncherName = "ApplicationLauncher"
const LauncherCloserName = "ApplicationLauncherCloser"

export default Applications

function AppButton({ app }: { app: Apps.Application }) {
  return <button
    className="App"
    onClicked={() => {
      HideLauncherMenu()
      app.launch()
    }}>
    <box>
      <icon icon={app.iconName} />
      <box valign={Gtk.Align.CENTER} vertical>
        <label
          className="name"
          truncate
          xalign={0}
          label={app.name}
        />
        {app.description && <label
          className="description"
          wrap
          xalign={0}
          label={app.description}
        />}
      </box>
    </box>
  </button>
}


export function ToggleLauncherMenu() {
  App.toggle_window(LauncherName)
  App.toggle_window(LauncherCloserName)
  return App.get_window(LauncherName)?.visible
}

export function ShowLauncherMenu() {
  App.get_window(LauncherName)?.show()
  App.get_window(LauncherCloserName)?.show_all()
}

export function HideLauncherMenu() {
  App.get_window(LauncherName)?.hide()
  App.get_window(LauncherCloserName)?.hide()
}

export function Launcher() {
  const text = Variable("")
  const results = text(text => Applications.fuzzy_query(text).slice(0, MAX_ITEMS))
  const onEnter = () => {
    const applications = results.get()
    if (applications.length > 0) {
      applications[0]?.launch()
    }
    HideLauncherMenu()
  }

  // Create the launcher top-level window
  const launcher = <window
    name={LauncherName}
    namespace={LauncherName}
    anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT}
    exclusivity={Astal.Exclusivity.EXCLUSIVE}
    keymode={Astal.Keymode.EXCLUSIVE}
    application={App}
    onShow={() => text.set("")}
    layer={Astal.Layer.OVERLAY}
    visible={false}
    onKeyPressEvent={function(_, event: Gdk.Event) {
      if (event.get_keyval()[1] === Gdk.KEY_Escape) {
        HideLauncherMenu()
      }
    }}>
    <box className="Launcher" vertical>
      <entry
        placeholderText="Search"
        text={text()}
        onChanged={self => text.set(self.text)}
        onActivate={onEnter}
      />
      <box spacing={6} vertical>
        {results.as((applications) => applications.map((app) => (
          <AppButton app={app} />
        )))}
      </box>
      <box
        halign={Gtk.Align.CENTER}
        className="not-found"
        vertical
        visible={results.as(l => l.length === 0)}>
        <icon icon="system-search-symbolic" />
        <label label="No match found" />
      </box>
    </box>
  </window> as Gtk.Window

  PopupCloser(LauncherCloserName, bind(CurrentGdkMonitor), launcher)

  CurrentGdkMonitor.subscribe((_) => HideLauncherMenu())

  return launcher
}
