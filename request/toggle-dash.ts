import { ToggleDashMenu } from "../widget/DashMenu"
import RequestHandler from "./request"

export default class ToggleDash implements RequestHandler {
  public name = "toggle-dash"
  public description = "Toggle the quick settings dash menu"

  public handler(args: string | undefined) {
    if (args !== undefined) {
      throw new Error(`${this.name} expects no arguments`)
    }

    return {
      "dash": ToggleDashMenu(),
    }
  }
}
