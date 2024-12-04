import RequestHandler from "./request"
import { ShowPopup, HidePopup, TogglePopup, ActivePopup } from "../components/popup"

export default class Popup implements RequestHandler {
  public name = "popup"
  public usage = "popup [show|hide|toggle] popup-name"
  public description = "Show or hide popup windows"

  public handler(args: string[]) {
    if (args.length !== 2) {
      throw new Error(`expected 2 arguments, but received ${args.length}`)
    }

    const [command, popup_name] = args

    switch (command) {
      case "show":
        ShowPopup(popup_name)
        break
      case "hide":
        HidePopup(popup_name)
        break
      case "toggle":
        TogglePopup(popup_name)
        break
    }

    return { active: ActivePopup() }
  }
}

