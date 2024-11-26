import { Variable, timeout } from "astal"
import { Gtk } from "astal/gtk3"
import { Subscribable } from "astal/binding"
import Notifd from "gi://AstalNotifd"
import Notification from "./Notification"

const notifd = Notifd.get_default()
const DEFAULT_POPUP_TIMEOUT = 5000

export default class NotificationCache implements Subscribable {
  private map: Map<number, Gtk.Widget> = new Map()
  private var: Variable<Array<Gtk.Widget>> = Variable([])

  public notify() {
    this.var.set([...this.map.values()].reverse())
  }

  public constructor() {
    notifd.connect("notified", (_, id) => this.show(notifd.get_notification(id), true))
    notifd.connect("resolved", (_, id) => this.delete(id))
  }

  public show(notif: Notifd.Notification, useTimeout: boolean = true) {
    this.set(notif.id, Notification({
      notification: notif,
      onHoverLost: () => { },
      setup: () => {
        if (useTimeout && notif.get_expire_timeout() !== null) {
          timeout(DEFAULT_POPUP_TIMEOUT, () => this.delete(notif.id))
        }
      },
    }))
  }

  public hide(notif: Notifd.Notification) {
    this.delete(notif.id)
  }

  public clear() {
    this.map.forEach((v) => v.destroy())
    this.map.clear()
    this.notify()
  }

  private set(key: number, value: Gtk.Widget) {
    this.map.get(key)?.destroy()
    this.map.set(key, value)
    this.notify()
  }

  private delete(key: number) {
    this.map.get(key)?.destroy()
    this.map.delete(key)
    this.notify()
  }

  get() {
    return this.var.get()
  }

  subscribe(callback: (list: Array<Gtk.Widget>) => void) {
    return this.var.subscribe(callback)
  }
}

