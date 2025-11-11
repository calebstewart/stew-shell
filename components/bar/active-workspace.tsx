import { createBinding, createComputed, Accessor, With } from "ags"
import { Gtk, Gdk } from "ags/gtk4"
import AstalHyprland from "gi://AstalHyprland"
import Apps from "gi://AstalApps"

import { LauncherPopover } from "@components/launcher"

export function ActiveWorkspace({ monitor, gdkmonitor, index }: {
  monitor: Accessor<AstalHyprland.Monitor>,
  gdkmonitor: Gdk.Monitor,
  index: Accessor<number>,
}) {
  const apps = Apps.Apps.new()
  const applications = createBinding(apps, "list")
  const iconTheme = Gtk.IconTheme.get_for_display(gdkmonitor.display)

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
                  const label = client === null ? "Desktop" : createBinding(client, "title")
                  const initialClass = createBinding(client, "initial_class")

                  // Do our best to identify the application icon by trying the initial class
                  // as an icon name in the current icon theme, then try to locate an application
                  // in the app database with a matching class name and use the database icon.
                  const icon = client === null ? "display" : createComputed([initialClass, applications], (initialClass, applications) => {
                    if (iconTheme.has_icon(initialClass)) {
                      return initialClass
                    } else {
                      return applications.find((app) => app.wm_class == initialClass)?.icon_name || "monitor"
                    }
                  })

                  return <menubutton class="flat" name="launcher-button">
                    <box>
                      <image class="icon" icon_name={icon} valign={Gtk.Align.CENTER} />
                      <label label={label} valign={Gtk.Align.BASELINE_CENTER} />
                    </box>
                    <LauncherPopover monitor={monitor} />
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
