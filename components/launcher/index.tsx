import { For, createBinding, createState } from "ags"
import { Gtk, Gdk } from "ags/gtk4"
import { interval } from "ags/time"

import AstalHyprland from "gi://AstalHyprland"
import AstalApps from "gi://AstalApps"
import Gio from "gi://Gio?version=2.0"

import PopoverRegistry from "@components/popoverregistry"

export const LauncherRegistry = new PopoverRegistry()

// Export a global instance of the application list
export const Apps = AstalApps.Apps.new()

// This will start the given application presuming it has a valid
// desktop entry. It will start the application without using the
// 'launch()' method. This is because the launch method spawns the
// application as a subprocess of the shell which isn't ideal.
//
// Instead, we use `systemd-run` to execute 'gio launch [path/to/app.desktop]`
// to execute the application. The name of the transient unit will be:
// 'app-{desktop-file-basename}-{random-six-chars}.service'. This is in
// compliance with the specification here:  https://systemd.io/DESKTOP_ENVIRONMENTS/
export function launchApplication(app: AstalApps.Application) {
  const entry = Gio.DesktopAppInfo.new(app.entry)
  const basename = app.entry.replace(/\.desktop$/, "")
  const identifier = [1, 2, 3, 4, 5, 6].map((_) => {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    return charset[Math.floor(Math.random() * charset.length)]
  }).reduce((prev, current) => prev + current)
  const unit_name = `app-${basename}-${identifier}`

  const args = [
    "systemd-run",
    "--user",
    `--slice=app`,
    `--unit=${unit_name}`,
    `--description=${app.get_description()}`,
    "--same-dir",
    "--service-type=forking",
    "gio", "launch", entry.get_filename()!,
  ]

  Gio.Subprocess.new(
    args,
    Gio.SubprocessFlags.NONE,
  ).wait(null)
}

// A button which shows the icon and name/description of the given application
// and will launch the application on click.
export function Application({ app, onActivate }: {
  app: AstalApps.Application,
  onActivate?: (app: AstalApps.Application) => void,
}) {
  const icon_name = createBinding(app, "icon_name")
  const name = createBinding(app, "name")

  return <button
    class="app flat"
    onClicked={() => { launchApplication(app); onActivate && onActivate(app) }} >
    <box>
      <image icon_name={icon_name} icon_size={Gtk.IconSize.LARGE} valign={Gtk.Align.CENTER} />
      <box valign={Gtk.Align.CENTER} orientation={Gtk.Orientation.VERTICAL}>
        <label class="name" xalign={0} label={name} />
        <label class="description" wrap={true} xalign={0} label={app.description} visible={Boolean(app.description)} />
      </box>
    </box>
  </button>
}

export function LauncherPopover({ monitor }: { monitor: AstalHyprland.Monitor }): Gtk.Popover {
  const [input, setInput] = createState("")
  const matchingApps = input((query) => Apps.fuzzy_query(query))
  const noMatchingApps = matchingApps((apps) => apps.length == 0)
  const setup = (self: Gtk.Popover) => LauncherRegistry.add(monitor, self)
  const destroy = (self: Gtk.Popover) => LauncherRegistry.remove(self);

  var searchEntry: Gtk.SearchEntry

  const activate = (_: Gtk.SearchEntry) => {
    const apps = matchingApps.get()
    if (apps.length > 0) {
      launchApplication(apps[0])
      searchEntry.text = ""
      LauncherRegistry.popdownFor(monitor)
    }
  }

  const stopSearch = () => {
    searchEntry && searchEntry.set_text("")
    LauncherRegistry.popdownFor(monitor)
  }


  return <popover class="launcher" $={setup} onDestroy={destroy}>
    <box orientation={Gtk.Orientation.VERTICAL}>
      <Gtk.SearchEntry
        text={input}
        onSearchChanged={(entry) => setInput(entry.text)}
        onActivate={activate}
        onStopSearch={stopSearch}
        $={(self) => { searchEntry = self; }} />
      <scrolledwindow propagate_natural_width={true} propagate_natural_height={true}>
        <box spacing={6} orientation={Gtk.Orientation.VERTICAL}>
          <For each={matchingApps}>
            {(app) => (
              <Application app={app} onActivate={() => stopSearch()} />
            )}
          </For>
          <box halign={Gtk.Align.CENTER} class="not-found" visible={noMatchingApps}>
            <image icon_name="system-search-symbolic" />
            <label label="No matching applications found" />
          </box>
        </box>
      </scrolledwindow>
    </box>
  </popover> as Gtk.Popover
}
