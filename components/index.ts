import SetupBars from "@components/bar"
import SetupLauncher from "@components/launcher"
import SetupLocker from "@components/locker"
import SetupSettingsMenu from "@components/settings-menu"
import SetupNotifications from "@components/notifications"
import { SetupPopups } from "@components/popup"

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
