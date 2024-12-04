import SetupNotificationPopup from "./popup"
import SetupNotificationDrawer from "./drawer"

export {
  DisableNotificationPopup,
  DoNotDisturb
} from "./popup"

export {
  default as NotificationList,
  NotificationListProps,
} from "./list"

export {
  default as Notification
} from "./notification"

export {
  default as NotificationCache
} from "./cache"

export {
  NotificationDrawerButton
} from "./drawer"

export default function SetupNotifications() {
  SetupNotificationPopup()
  SetupNotificationDrawer()
}
