import { Variable, GLib, Gio } from "astal"
import { register } from "astal/gobject"
import { Astal, App, Gdk, Gtk } from "astal/gtk3"
import GtkSessionLock from "gi://GtkSessionLock"

import RegisterPerMonitorWindows from "../per-monitor"

const Anchor = Astal.WindowAnchor
const window_registry = new Map<Gdk.Monitor, Gtk.Widget>()
var lock: GtkSessionLock.Lock | undefined = undefined
var unregister_display_signals: undefined | (() => void) = undefined

export const DesktopLocked = Variable(false)

export function SetupLockerShade(monitor: Gdk.Monitor) {
  return <window
    className="LockerShade"
    namespace="LockerShade"
    gdkmonitor={monitor}
    exclusivity={Astal.Exclusivity.EXCLUSIVE}
    anchor={Anchor.TOP | Anchor.BOTTOM | Anchor.LEFT | Anchor.RIGHT}
    layer={Astal.Layer.OVERLAY}
    application={App}
    visible={false}
    onKeyPressEvent={(_win, _event) => {
      DesktopLocked.set(false)
    }}>
  </window> as Gtk.Window
}

function lock_session() {
  if (lock != undefined) {
    return
  }

  lock = GtkSessionLock.prepare_lock()
  lock.lock_lock()

  unregister_display_signals = RegisterPerMonitorWindows(window_registry, (monitor) => {
    const window = SetupLockerShade(monitor)
    lock!.new_surface(window, monitor)
    window.show_all()
    return window
  })
}

function unlock_session() {
  if (lock === undefined) {
    return
  }

  // Ensure no new lock windows are created
  if (unregister_display_signals) {
    unregister_display_signals()
    unregister_display_signals = undefined
  }

  // Unlock the session
  lock.unlock_and_destroy()
  lock = undefined

  // Destroy existing windows
  window_registry.forEach((w) => {
    GtkSessionLock.unmap_lock_window(w.get_toplevel() as Gtk.Window)
    w.destroy()
  })

  // Clear the list
  window_registry.clear()
}

export default function SetupLocker() {
  if (!GtkSessionLock.is_supported()) {
    console.warn("ext-session-lock-v1 is not supported your compositor; session lock functionality is disabled")
    return
  }

  DesktopLocked.subscribe((locked) => {
    if (locked) {
      lock_session()
    } else {
      unlock_session()
    }
  })
}
