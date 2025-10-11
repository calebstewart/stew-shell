import { createBinding, createComputed, For, Accessor, With } from "ags"
import { Gtk, Gdk } from "ags/gtk4"
import AstalHyprland from "gi://AstalHyprland"

export function Workspaces({ monitor, gdkmonitor, index }: {
  monitor: Accessor<AstalHyprland.Monitor>,
  gdkmonitor: Gdk.Monitor,
  index: Accessor<number>,
}) {
  return <With value={monitor}>
    {(monitor) => {
      const workspaces = createBinding(AstalHyprland.get_default(), "workspaces")((workspaces) => {
        return workspaces
          .filter((workspace) => workspace.monitor == monitor)
          .sort((a, b) => (a.id - b.id))
      })
      const activeWorkspace = createBinding(monitor, "active_workspace")

      return <box class="workspaces" orientation={Gtk.Orientation.HORIZONTAL}>
        <For each={workspaces}>
          {(workspace) => {
            const id = createBinding(workspace, "id")
            const label = id((id) => (id % 10).toString())
            const active = activeWorkspace((activeWorkspace) => activeWorkspace == workspace)

            return <togglebutton active={active} onClicked={() => workspace.focus()} label={label} />
          }}
        </For>
      </box>
    }}
  </With>
}
