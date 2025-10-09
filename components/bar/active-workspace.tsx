import { createBinding, createComputed, Accessor, With } from "ags"
import { Gtk, Gdk } from "ags/gtk4"
import Hyprland from "gi://AstalHyprland"
import Apps from "gi://AstalApps"

import GObject from "gi://GObject"
import { Launcher } from "@components/launcher"

var LauncherButton: Gtk.MenuButton | null = null;

export function ToggleLauncher() {
  if (LauncherButton !== null) {
    LauncherButton.activate()
  }
}

export function find_child(name: string, parent: Gtk.Widget): Gtk.Widget | null {
  if (!parent.visible) {
    return null
  }

  for (var child = parent.get_first_child(); child !== null; child = child.get_next_sibling()) {
    if (child.name === name && child.visible) {
      return child
    } else {
      const result = find_child(name, child)
      if (result !== null) {
        return result
      }
    }
  }

  return null
}

export function ActiveWorkspace({ gdkmonitor, index }: {
  gdkmonitor: Gdk.Monitor,
  index: Accessor<number>,
}) {
  const hyprland = Hyprland.get_default()
  const apps = Apps.Apps.new()
  const monitors = createBinding(hyprland, "monitors")
  const monitor = createComputed([monitors, index], (monitors, index) => monitors[index])
  const applications = createBinding(apps, "list")
  const iconTheme = Gtk.IconTheme.get_for_display(gdkmonitor.display)
  const setupButton = (button: Gtk.MenuButton) => { LauncherButton = button; }

  return <With value={monitor}>
    {(monitor) => {
      const activeWorkspace = createBinding(monitor, "active_workspace")

      return <box class="active_workspace">
        <With value={activeWorkspace}>
          {(workspace) => {
            const client = createBinding(workspace, "last_client")

            return <box>
              <With value={client}>
                {(client) => {
                  if (client === null) {
                    // Probably this is a new workspace, and there are no previous clients
                    return <menubutton name="launcher-button" popover={Launcher()} $={setupButton}>
                      <box>
                        <image class="icon" icon_name="display" />
                        <label label="Desktop" />
                      </box>
                    </menubutton>
                  }

                  const label = createBinding(client, "title")
                  const initialClass = createBinding(client, "initial_class")

                  // Do our best to identify the application icon by trying the initial class
                  // as an icon name in the current icon theme, then try to locate an application
                  // in the app database with a matching class name and use the database icon.
                  const icon = createComputed([initialClass, applications], (initialClass, applications) => {
                    if (iconTheme.has_icon(initialClass)) {
                      return initialClass
                    } else {
                      return applications.find((app) => app.wm_class == initialClass)?.icon_name || "monitor"
                    }
                  })

                  return <menubutton name="launcher-button" popover={Launcher()} $={setupButton}>
                    <box>
                      <image class="icon" icon_name={icon} />
                      <label label={label} />
                    </box>
                  </menubutton>
                }}
              </With>
            </box>
          }}
        </With>
      </box>
    }}
  </With>
}
