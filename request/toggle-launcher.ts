import { ToggleLauncherMenu } from "../components/launcher"
import RequestHandler from "./request"

export default class ToggleLauncher implements RequestHandler {
  public name = "toggle-launcher"
  public description = "Toggle the application launcher menu"

  public handler(args: string | undefined) {
    if (args !== undefined) {
      throw new Error(`${this.name} expects no arguments`)
    }

    return {
      "launcher": ToggleLauncherMenu(),
    }
  }
}

