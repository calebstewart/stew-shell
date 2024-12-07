import { Variable } from "astal"
import { Gtk, Gdk } from "astal/gtk3"
import { bind } from "astal/binding"
import Hyprland from "gi://AstalHyprland"

import { Applications, ToggleLauncherMenu, IconForClass } from "@components/launcher"

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

export function GetGdkMonitor(hm: Hyprland.Monitor): Gdk.Monitor {
  const display = Gdk.Display.get_default()
  const screen = display?.get_default_screen()

  for (let i = 0; i < (display?.get_n_monitors() || 0); i++) {
    if (screen?.get_monitor_plug_name(i) === hm.name) {
      return display!.get_monitor(i)!
    }
  }

  throw new Error("GDK monitor does not map to a Hyprland monitor")
}

export function ActiveClient(monitorIndex: number) {
  const LastWorkspaceID = Variable(String(1 + monitorIndex * 10))

  return bind(hyprland, "workspaces").as((workspaces) => {
    // Filter workspaces down to our monitor
    workspaces = workspaces.filter((ws) => WorkspaceOnMonitor(monitorIndex, ws))

    // Create a new array of either the workspace or 'undefined' for non-existent workspaces
    const all_workspaces = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
      return workspaces.find((ws) => ws.id === (n + monitorIndex * 10))
    })

    // A stack to animate transitions between workspaces
    return <stack
      transition_type={Gtk.StackTransitionType.CROSSFADE}
      visible_child_name={bind(hyprland, "focused_workspace").as((ws) => {
        // We only update the visible stack child for workspaces within
        // our monitor. We use LastWorkspaceID to maintain the last-active
        // workspace even when we focus another monitor
        if (WorkspaceOnMonitor(monitorIndex, ws)) {
          LastWorkspaceID.set(String(ws.id))
        }

        return LastWorkspaceID.get()
      })}>
      {all_workspaces.map((ws, idx) => {
        if (ws === undefined) {
          // For each workspace, we either create a generic "Display" label if it doesn't exist
          return <box className="ActiveClient" name={String(1 + idx + monitorIndex * 10)}>
            <button onClicked={ToggleLauncherMenu}>
              <icon icon="display" />
            </button>
            <label label="Desktop" />
          </box>
        } else {
          // Or we create the real active client label for existing workspaces. If there is no
          // active client, then the label is identical to a non-existent workspace. This makes
          // sure that during the transition when a new workspace is created, if we accidentally
          // show the non-existent label, it looks the same as a brand-new empty workspace.
          return <box className="ActiveClients" name={String(ws.id)}>
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
          </box>
        }
      })}
    </stack>
  })
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
