import { GLib } from "astal"
import RequestHandler from "./request"

export default class Environ implements RequestHandler {
  public name = "environ"
  public description = "Return the current contents of the process environment as reported by GLib"

  public handler(args: string[]) {
    if (args.length > 0) {
      throw new Error(`${this.name} expects no arguments`)
    }

    return Object.fromEntries(GLib.get_environ().map((v) => v.split("=", 2)))
  }
}

