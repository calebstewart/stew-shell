import { ToggleSettingsMenu } from "../components/settings-menu"
import RequestHandler from "./request"

export default class ToggleDash implements RequestHandler {
  public name = "toggle-settings-menu"
  public description = "Toggle the quick settings dash menu"

  public handler(args: string[]) {
    if (args.length > 0) {
      throw new Error(`${this.name} expects no arguments`)
    }

    return {
      "state": ToggleSettingsMenu(),
    }
  }
}
