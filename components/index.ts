import { App, Gtk, Gdk } from "astal/gtk3"

import SetupBar from "./bar"
import SetupLauncher from "./launcher"
import SetupLocker from "./locker"
import SetupSettingsMenu from "./settings-menu"
import SetupNotificationPopup from "./notifications"

export default function Setup() {
  // Setup the ext-locker-v1 interface
  // SetupLocker()

  // Setup the launcher popup
  SetupLauncher()

  // Setup the settings menu popup
  SetupSettingsMenu()

  // Setup the notification popup
  SetupNotificationPopup()

  // Create initial status bars
  const bars = new Map<Gdk.Monitor, Gtk.Widget>()
  App.get_monitors().forEach((mon, idx) => {
    bars.set(mon, SetupBar(mon, idx))
  })

  // Automatically create new ones for new monitors
  App.connect("monitor-added", (_, new_monitor) => {
    App.get_monitors().forEach((mon, idx) => {
      if (mon === new_monitor) {
        bars.set(mon, SetupBar(mon, idx))
      }
    })
  })

  // Remove bars for removed monitors
  App.connect("monitor-removed", (_, mon) => {
    bars.get(mon)?.destroy()
    bars.delete(mon)
  })
}
