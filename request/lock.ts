import { App } from "astal/gtk3"

import { SessionLocked } from "@components/locker"

import RequestHandler from "./request"

export class LockSession implements RequestHandler {
  public name = "lock"
  public description = "Lock the session"

  public handler(args: string[]) {
    if (args.length > 0) {
      throw new Error(`${this.name} expects no arguments`)
    }

    SessionLocked.set(true)

    return { "locked": true }
  }
}

export class UnlockSession implements RequestHandler {
  public name = "unlock"
  public description = "Unlock the session"

  public handler(args: string[]) {
    if (args.length > 0) {
      throw new Error(`${this.name} expects no arguments`)
    }

    // Don't let the session lock be bypassed when we aren't in development
    if (App.instance_name !== "dev") {
      throw new Error("Session lock bypass rejected")
    }

    SessionLocked.set(false)

    return { "locked": false }
  }
}
