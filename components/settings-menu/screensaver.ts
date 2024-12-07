import { GObject, register, property, Gio, GLib } from "astal"

export interface ScreenSaverProps {
  bus?: Gio.DBusConnection
  application_name: string
  reason_for_inhibit: string
  inhibit?: boolean
}

@register()
export class ScreenSaver extends GObject.Object {
  declare private _cookie: number | null

  @property(Gio.DBusConnection)
  declare bus: Gio.DBusConnection

  @property(String)
  declare application_name: string

  @property(String)
  declare reason_for_inhibit: string

  @property(Boolean)
  get inhibit() {
    return this._cookie !== null
  }

  set inhibit(v: boolean) {
    if (this._cookie === null) {
      if (v) {
        this._cookie = this.do_inhibit()
      } else {
        return
      }
    } else {
      if (v) {
        return
      } else {
        this.do_unhibit(this._cookie)
        this._cookie = null
      }
    }
  }

  @property(Number)
  get cookie() {
    return this._cookie
  }

  constructor({
    bus = Gio.DBus.session,
    application_name,
    reason_for_inhibit,
    inhibit = false,
  }: ScreenSaverProps) {
    super({
      bus: bus,
      application_name: application_name,
      reason_for_inhibit: reason_for_inhibit,
    })

    this._cookie = null
    this.inhibit = inhibit
  }

  private do_inhibit(): number {
    const retval = this.call(
      "Inhibit",
      GLib.Variant.new_tuple([
        GLib.Variant.new_string(this.application_name),
        GLib.Variant.new_string(this.reason_for_inhibit)
      ]),
      GLib.VariantType.new("(u)")
    )

    return retval!.recursiveUnpack()[0]
  }

  private do_unhibit(cookie: number) {
    this.call(
      "UnInhibit",
      GLib.Variant.new_tuple([
        GLib.Variant.new_uint32(cookie)
      ]),
      null
    )
  }

  private call(method: string, params: GLib.Variant | null, responseType: GLib.VariantType | null): GLib.Variant | null {
    return this.bus.call_sync(
      "org.freedesktop.ScreenSaver",
      "/org/freedesktop/ScreenSaver",
      "org.freedesktop.ScreenSaver",
      method,
      params,
      responseType,
      Gio.DBusCallFlags.ALLOW_INTERACTIVE_AUTHORIZATION,
      -1,
      null
    )
  }
}
