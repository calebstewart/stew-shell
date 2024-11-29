import { bind } from "astal/binding"
import { App } from "astal/gtk3"
import style from "./style.scss"
import Bar from "./widget/Bar"
import NotificationPopup from "./widget/NotificationPopup"
import { Launcher } from "./widget/Applications"
import { CurrentGdkMonitor } from "./widget/Hyprland"
import DashMenu from "./widget/DashMenu"
import HandleRequest from "./request"

App.start({
  css: style,
  main() {
    // Pop-up notifications on the currently selected monitor
    NotificationPopup(bind(CurrentGdkMonitor))

    // Pop-up application launcher window
    Launcher()

    // Pop-up dash menu containing notifications, media player(s) and quick settings
    DashMenu()

    // Status bar per-monitor
    App.get_monitors().map(Bar)
  },
  requestHandler: HandleRequest,
})
