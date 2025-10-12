import { register, property, getter, setter } from "gnim/gobject"

import GObject from "gi://GObject?version=2.0"
import Gio from "gi://Gio?version=2.0"
import GLib from "gi://GLib?version=2.0"

export interface ScreenSaverProps {
  bus?: Gio.DBusConnection
  application_name: string
  reason_for_inhibit: string
  inhibit?: boolean
}

@register()
export class ScreenSaver extends GObject.Object {
  private _cookie: number = -1

  @property(Gio.DBusConnection) bus: Gio.DBusConnection
  @property(String) application_name: string
  @property(String) reason_for_inhibit: string

  @getter(Boolean)
  get inhibit() {
    return this._cookie !== -1
  }

  @setter(Boolean)
  set inhibit(v: boolean) {
    if (this._cookie === -1) {
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
        this._cookie = -1
      }
    }
  }

  @getter(Number)
  get cookie() {
    return this._cookie
  }

  constructor({
    bus = Gio.DBus.session,
    application_name,
    reason_for_inhibit,
    inhibit = false,
  }: ScreenSaverProps) {
    super()

    this.bus = bus
    this.application_name = application_name
    this.reason_for_inhibit = reason_for_inhibit
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
