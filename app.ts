import { bind } from "astal/binding"
import { App, Gtk } from "astal/gtk3"
import style from "./style.scss"
import Bar from "./widget/Bar"
import NotificationPopup from "./widget/NotificationPopup"
import { Launcher, ToggleLauncher } from "./widget/Applications"
import { CurrentGdkMonitor } from "./widget/Hyprland"
import DashMenu, { ToggleDashMenu } from "./widget/DashMenu"

App.start({
  css: style,
  main() {
    NotificationPopup(bind(CurrentGdkMonitor))
    Launcher()
    DashMenu()

    App.get_monitors().map((mon, idx) => {
      Bar(mon, idx)
    })
  },
  requestHandler(request: string, rawRespond: (response: any) => void) {
    const respond = (v: any) => rawRespond(JSON.stringify(v))

    try {
      switch (request) {
        case "toggle-launcher":
          respond({ "launcher_visible": ToggleLauncher() })
          break
        case "toggle-dash":
          respond({ "dash_visible": ToggleDashMenu() })
          break
        default:
          respond({ "error": `unknown command: ${request}` })
          break
      }
    } catch (e) {
      respond({ "error": "unhandled exception", "exception": e })
    }
  },
})
