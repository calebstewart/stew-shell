import { createBinding, createComputed, For, Accessor, With } from "ags"
import { Gtk } from "ags/gtk4"
import Hyprland from "gi://AstalHyprland"

export function Workspaces({ index }: {
  index: Accessor<number>,
}) {
  const hyprland = Hyprland.get_default()
  const monitors = createBinding(hyprland, "monitors")
  const monitor = createComputed([monitors, index], (monitors, index) => monitors[index])

  return <With value={monitor}>
    {(monitor) => {
      const workspaces = createBinding(hyprland, "workspaces")((workspaces) => {
        return workspaces
          .filter((workspace) => workspace.monitor == monitor)
          .sort((a, b) => (a.id - b.id))
      })
      const activeWorkspace = createBinding(monitor, "active_workspace")

      return <box class="workspaces" orientation={Gtk.Orientation.HORIZONTAL}>
        <For each={workspaces}>
          {(workspace) => {
            const id = createBinding(workspace, "id")
            const label = createComputed([id, index], (id, index) => (id - (index * 10)).toString())
            const active = activeWorkspace((activeWorkspace) => activeWorkspace == workspace)

            return <togglebutton active={active} onClicked={() => workspace.focus()} label={label} />
          }}
        </For>
      </box>
    }}
  </With>
}
