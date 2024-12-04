import SetupBars from "./bar"
import SetupLauncher from "./launcher"
import SetupLocker from "./locker"
import SetupSettingsMenu from "./settings-menu"
import SetupNotifications from "./notifications"
import { SetupPopups } from "./popup"

export default function Setup() {
  // Setup generic popups
  SetupPopups()

  // Setup the ext-locker-v1 interface
  SetupLocker()

  // Setup the launcher popup
  SetupLauncher()

  // Setup the settings menu popup
  SetupSettingsMenu()

  // Setup the notification popup
  SetupNotifications()

  // Setup the status bars per-monitor
  SetupBars()
}
