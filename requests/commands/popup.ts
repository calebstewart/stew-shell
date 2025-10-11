import { CommandInterface } from "@requests/command"

import PopoverRegistry from "@components/popoverregistry"
import { LauncherRegistry } from "@components/launcher"
import { ControlPanelRegistry } from "@components/control-panel"

export default class PopupCommand implements CommandInterface {
  name: string = "popup"
  argc: number = 2
  help: string = "Show a popup window by name"
  usage: string = "(launcher|control-panel)"

  static readonly REGISTRIES = new Map<string, PopoverRegistry>([
    ["launcher", LauncherRegistry],
    ["control-panel", ControlPanelRegistry],
  ])

  execute(args: string[]): string {
    const registry = PopupCommand.REGISTRIES.get(args[1])
    if (registry === undefined) {
      return `error: unknown popup: ${args[1]}`
    } else {
      registry.popup()
      return `${args[1]} has been activated`
    }
  }
}
