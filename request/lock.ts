import { DesktopLocked } from "../components/locker"
import RequestHandler from "./request"

export class LockSession implements RequestHandler {
  public name = "lock"
  public description = "Lock the session"

  public handler(args: string | undefined) {
    if (args !== undefined) {
      throw new Error(`${this.name} expects no arguments`)
    }

    const value = DesktopLocked.get()
    if (!value) {
      DesktopLocked.set(true)
    }

    return {
      "state": true,
    }
  }
}

export class UnlockSession implements RequestHandler {
  public name = "unlock"
  public description = "Unlock the session"

  public handler(args: string | undefined) {
    if (args !== undefined) {
      throw new Error(`${this.name} expects no arguments`)
    }

    const value = DesktopLocked.get()
    if (value) {
      DesktopLocked.set(false)
    }

    return {
      "state": false,
    }
  }
}
