import { Gtk, Gdk } from "astal/gtk3"
import { bind } from "astal/binding"
import Hyprland from "gi://AstalHyprland"
import { Applications, ToggleLauncherMenu, IconForClass } from "../launcher"

const hyprland = Hyprland.get_default()

function WorkspaceOnMonitor(monitorIndex: number, ws: Hyprland.Workspace): boolean {
  return ws.id >= (monitorIndex * 10 + 1) && ws.id < (monitorIndex * 10 + 10)
}

export function GetHyprlandMonitor(gm: Gdk.Monitor): Hyprland.Monitor {
  const display = Gdk.Display.get_default()
  const screen = display?.get_default_screen()

  for (let i = 0; i < (display?.get_n_monitors() || 0); i++) {
    if (gm === display?.get_monitor(i)) {
      return hyprland.get_monitors().find((m) => m.name === screen?.get_monitor_plug_name(i))!
    }
  }

  throw new Error("GDK monitor does not map to a Hyprland monitor")
}

export function ActiveClient(monitorIndex: number) {
  return bind(hyprland, "workspaces").as((workspaces) => workspaces
    .filter((ws) => WorkspaceOnMonitor(monitorIndex, ws))
    .sort((a, b) => a.id - b.id)
    .map((ws) => (
      <box className="ActiveClients">
        <revealer
          reveal_child={bind(hyprland, "focused_workspace").as((fws) => fws === ws)}
          transition_type={Gtk.RevealerTransitionType.SLIDE_RIGHT}>
          {bind(ws, "last_client").as((client) => {
            if (client !== null) {
              return <box className="ActiveClient">
                <button onClicked={ToggleLauncherMenu}>
                  <icon icon={bind(Applications, "list").as((apps) => IconForClass(apps, client.initial_class, "monitor"))} />
                </button>
                <label truncate label={bind(client, "title").as((t) => t || "Desktop")} />
              </box>
            } else {
              return <box className="ActiveClient">
                <button onClicked={ToggleLauncherMenu}>
                  <icon icon="display" />
                </button>
                <label label="Desktop" />
              </box>
            }
          })}
        </revealer>
      </box>
    ))
  )
}

export function Workspaces(monitorIndex: number) {
  return bind(hyprland, "workspaces").as((workspaces) => workspaces
    .filter((ws) => WorkspaceOnMonitor(monitorIndex, ws))
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
