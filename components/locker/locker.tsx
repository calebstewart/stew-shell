import { GObject, register, property, signal } from "astal"
import Auth from "gi://AstalAuth"

export enum State {
  UNLOCKED,
}

@register()
export class Locker extends GObject.Object {
  declare private _pam_connect_ids: number[]
  declare private _state: State

  @property(Boolean)
  get locked() {
    return this._state !== State.UNLOCKED
  }

  @property(Auth.Pam)
  declare public pam: Auth.Pam

  @signal()
  declare session_locked: () => void

  @signal()
  declare session_unlocked: () => void

  public constructor(pam: Auth.Pam) {
    super({
      pam: pam,
    } as any)

    this._state = State.UNLOCKED
    this._pam_connect_ids = []

    this._pam_connect_ids.push(
      this.pam.connect("auth-error", (_, msg) => this.pam_auth_error(msg)),
      this.pam.connect("auth-info", (_, msg) => this.pam_auth_info(msg)),
      this.pam.connect("auth-prompt-visible", (_, msg) => this.pam_auth_prompt_visible(msg)),
      this.pam.connect("auth-prompt-hidden", (_, msg) => this.pam_auth_prompt_hidden(msg)),
      this.pam.connect("fail", (_, msg) => this.pam_fail(msg)),
      this.pam.connect("success", (_) => this.pam_success()),
    )
  }

  public vfunc_dispose() {
    this._pam_connect_ids.forEach((id) => this.pam.disconnect(id))
    this._pam_connect_ids.length = 0
  }

  private pam_auth_error(msg: string) { }

  private pam_auth_info(msg: string) { }

  private pam_auth_prompt_visible(msg: string) { }

  private pam_auth_prompt_hidden(msg: string) { }

  private pam_fail(msg: string) { }

  private pam_success() { }
}
