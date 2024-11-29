import { Variable } from "astal"
import { Astal, Gtk, Gdk } from "astal/gtk3"
import { bind } from "astal/binding"
import Hyprland from "gi://AstalHyprland"
import Applications, { ToggleLauncherMenu } from "./Applications"

const hyprland = Hyprland.get_default()

export const CurrentGdkMonitor = Variable.derive([bind(hyprland, "focused_monitor")], (hm) => FindGdkMonitor(hm))

export function FindGdkMonitor(monitor: Hyprland.Monitor): Gdk.Monitor {
  const display = Gdk.Display.get_default()
  const screen = display?.get_default_screen()

  for (let i = 0; i < (display?.get_n_monitors() || 0); i++) {
    if (screen?.get_monitor_plug_name(i) === monitor.name) {
      const gdmMonitor = display?.get_monitor(i)
      return gdmMonitor!
    }
  }

  throw new Error("could not find gdk monitor")
}

export function ActiveClient(_monitor: Hyprland.Monitor, monitorIndex: number) {
  return bind(hyprland, "workspaces").as((workspaces) => workspaces
    .filter((ws) => ws.id >= (monitorIndex * 10 + 1) && ws.id < (monitorIndex * 10 + 10))
    .sort((a, b) => a.id - b.id)
    .map((ws) => {
      const currentWorkspace = bind(hyprland, "focused_workspace").as((fws) => {
        return fws === ws
      })

      return <box className="ActiveClients">
        <revealer
          reveal_child={currentWorkspace}
          transition_type={Gtk.RevealerTransitionType.SLIDE_RIGHT}>
          {bind(ws, "last_client").as((client) => {
            if (client !== null) {
              return <box className="ActiveClient">
                <button onClicked={ToggleLauncherMenu}>
                  <icon icon={bind(Applications, "list").as((apps) => {
                    if (Astal.Icon.lookup_icon(client.initial_class) !== null) {
                      return client.initial_class
                    } else {
                      return apps.find((app) => app.wm_class === client.initial_class)?.icon_name || "display"
                    }
                  })} />
                </button>
                <label truncate label={bind(client, "title").as((t) => t || "Desktop")} />
              </box>
            } else {
              return <box className="ActiveClient">
                <icon icon="display" />
                <label label="Desktop" />
              </box>
            }
          })}
        </revealer>
      </box>
    })
  )
}

export function Workspaces(_monitor: Hyprland.Monitor, monitorIndex: number) {
  return bind(hyprland, "workspaces").as((workspaces) => workspaces
    .filter((ws) => ws.id >= (monitorIndex * 10 + 1) && ws.id < (monitorIndex * 10 + 10))
    .sort((a, b) => a.id - b.id)
    .map((ws) => {
      return <box className="Workspaces">
        <button
          onClicked={() => ws.focus()}
          className={bind(hyprland, "focused_workspace").as((fws) => fws === ws ? "focused" : "")}
          label={bind(ws, "id").as((id) => (id - (monitorIndex * 10)).toString())} />
      </box>
    })
  )
}
