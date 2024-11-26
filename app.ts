import { Variable } from "astal"
import { App, Gdk } from "astal/gtk3"
import style from "./style.scss"
import Bar, { Menubar } from "./widget/Bar"
import Hyprland from "gi://AstalHyprland"
import { bind } from "astal/binding"
import SystemMenu from "./widget/SystemMenu"

App.start({
  css: style,
  main() {
    const hyprland = Hyprland.get_default()

    // Create a binding for the active GDK Monitor at any given time
    const focusedGdkMonitor = bind(hyprland, "focused_monitor").as((hm) => {
      const display = Gdk.Display.get_default()

      if (display !== null) {
        const screen = display?.get_default_screen()

        for (let i = 0; i < display.get_n_monitors(); i++) {
          if (screen.get_monitor_plug_name(i) == hm.name) {
            const gm = display.get_monitor(i)
            if (gm === null) {
              return undefined
            } else {
              return gm
            }
          }
        }
      }

      return undefined
    })

    // Create the global system menu
    const systemMenu = SystemMenu({
      GdkMonitor: focusedGdkMonitor,
    })

    // Create a bar for each monitor
    App.get_monitors().map((mon, idx) => {
      Bar(mon, idx, systemMenu)

      // Menubar(mon, idx)
    })
  },
})
