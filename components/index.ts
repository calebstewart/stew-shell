import { App, Gtk, Gdk } from "astal/gtk3"

import SetupBars from "./bar"
import SetupLauncher from "./launcher"
import SetupLocker from "./locker"
import SetupSettingsMenu from "./settings-menu"
import SetupNotificationPopup from "./notifications"

export default function Setup() {
  // Setup the ext-locker-v1 interface
  SetupLocker()

  // Setup the launcher popup
  SetupLauncher()

  // Setup the settings menu popup
  SetupSettingsMenu()

  // Setup the notification popup
  SetupNotificationPopup()

  // Setup the status bars per-monitor
  SetupBars()
}
