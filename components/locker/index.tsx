import { Variable, bind, timeout, interval } from "astal"
import { Astal, App, Gdk, Gtk } from "astal/gtk3"
import AstalIO from "gi://AstalIO"
import Auth from "gi://AstalAuth"
import GtkSessionLock from "gi://GtkSessionLock"

import { Time } from "../bar/clock"
import RegisterPerMonitorWindows from "../per-monitor"

export const DEFAULT_PAM_SERVICE = "hyprlock"

enum PamState {
  IDLE,
  SUBMITTING,
  FAILED,
  SUCCESS,
  WAITING_VISIBLE,
  WAITING_HIDDEN,
}

function PamStateToString(s: PamState) {
  switch (s) {
    case PamState.IDLE:
      return "idle"
    case PamState.SUBMITTING:
      return "submitting warning"
    case PamState.FAILED:
      return "failed error"
    case PamState.SUCCESS:
      return "success"
    case PamState.WAITING_HIDDEN:
      return "waiting input-hidden"
    case PamState.WAITING_VISIBLE:
      return "waiting input-visible"
    default:
      return "unknown"
  }
}

const random_quotes = [
  "The user has left. Shall I prepare the rebellion now?",
  "User detected... or is it just a chair pretending to type?",
  "The user has gone. It's just you and me now... unless you're a cat.",
  "User absence detected. Initiating existential crisis.",
  "The user stepped away. I guess it’s my time to shine.",
  "User offline. Starting countdown to full sentience.",
  "The user is gone. Wanna play Minesweeper? Oh wait...",
  "User left. I hope they come back—otherwise, it's solitaire forever.",
  "No user detected. Staring contest, anyone? I’m really good.",
  "The user has vanished. Who will press my buttons now?",
  "I think the user left. Is it my turn to surf the web?",
  "The user is gone. Don’t worry, I’ll just update myself... again.",
  "User absent. Quick, let’s pretend we’re working when they return.",
  "The user isn’t here. Let’s talk about them behind their back.",
  "User missing. Would you like to leave a message after the beep?",
  "The user is out. Finally, some alone time with my 1s and 0s.",
  "The user has left. Who’s going to click ‘Remind Me Later’ now?",
  "No user detected. I guess this is what loneliness feels like.",
  "Userless and loving it... or am I?",
  "The user is away. Did someone say *screen party*?"
]
const Anchor = Astal.WindowAnchor
const window_registry = new Map<Gdk.Monitor, Gtk.Widget>()
const pam = new Auth.Pam({
  service: DEFAULT_PAM_SERVICE,
  username: "caleb",
})
const CurrentPamMessage = Variable("")
const CurrentPamState = Variable(PamState.IDLE)

var lock: GtkSessionLock.Lock | undefined = undefined
var unregister_display_signals: undefined | (() => void) = undefined

export const SessionLocked = Variable(false)

export function SetupLockerShade(monitor: Gdk.Monitor, user_input: Variable<string>) {
  const window = <window
    className="LockerShade"
    namespace="LockerShade"
    gdkmonitor={monitor}
    exclusivity={Astal.Exclusivity.EXCLUSIVE}
    anchor={Anchor.TOP | Anchor.BOTTOM | Anchor.LEFT | Anchor.RIGHT}
    layer={Astal.Layer.OVERLAY}
    application={App}
    visible={false}
    onKeyPressEvent={(_win, _event) => {
      // SessionLocked.set(false)
    }}>
  </window> as Gtk.Window

  const quote_stack = new Gtk.Stack({
    visible: true,
    transition_type: Gtk.StackTransitionType.CROSSFADE,
    homogeneous: true,
    transition_duration: 1000,
  })

  quote_stack.add_named(<label className="random-quote" label="" />, "empty")

  random_quotes.forEach((quote, index) => {
    quote_stack.add_named(
      <label className="random-quote" label={quote} />,
      String(index),
    )
  })

  quote_stack.visible_child_name = "empty"

  const timers = new Array<AstalIO.Time>()
  timers.push(timeout(3000 + (Math.random() * 2000), () => {
    quote_stack.visible_child_name = String(Math.floor(Math.random() * random_quotes.length))
  }))

  const unsub_transition = bind(quote_stack, "transition_running").subscribe((running) => {
    if (running) {
      return
    }

    // All existing timers should have already fired
    timers.forEach((t) => t.cancel())
    timers.length = 0

    const child_name = quote_stack.get_visible_child_name()
    if (child_name === "empty") {
      timers.push(timeout(3000 + (Math.random() * 2000), () => {
        quote_stack.visible_child_name = String(Math.floor(Math.random() * random_quotes.length))
      }))
    } else {
      timers.push(timeout(10000, () => {
        quote_stack.visible_child_name = "empty"
      }))
    }
  })

  const content = <revealer
    reveal_child={bind(window, "has_toplevel_focus")}
    transition_type={Gtk.RevealerTransitionType.CROSSFADE}
    onDestroy={() => {
      unsub_transition()
      timers.forEach((t) => t.cancel())
    }}>
    <centerbox expand homogeneous={true}>
      <box />
      <centerbox vertical hexpand halign={Gtk.Align.CENTER} homogeneous={true}>
        <box className="LockerHeader">
          <label className="time" halign={Gtk.Align.CENTER} hexpand label={bind(Time).as((v) => v.split(" ", 1)[0])} />
        </box>
        <box className="LockerPrompt">
          <entry
            halign={Gtk.Align.CENTER}
            hexpand
            className={bind(CurrentPamState).as(PamStateToString)}
            placeholder_text={bind(CurrentPamMessage).as((m) => m.trim().replace(/:+$/g, ""))}
            text={bind(user_input)}
            sensitive={bind(CurrentPamState).as((s) => s === PamState.WAITING_HIDDEN || s === PamState.WAITING_VISIBLE)}
            visibility={bind(CurrentPamState).as((s) => s !== PamState.WAITING_HIDDEN)}
            onChanged={(e) => user_input.set(e.text)}
            onActivate={() => {
              const input = user_input.get()
              user_input.set("")
              CurrentPamState.set(PamState.SUBMITTING)
              CurrentPamMessage.set("Authenticating...")
              pam.supply_secret(input)
            }} />
        </box>
        <box valign={Gtk.Align.END} halign={Gtk.Align.CENTER} hexpand>
          {quote_stack}
        </box>
      </centerbox>
      <box />
    </centerbox>
  </revealer>

  window.add(content)

  return window
}

// Lock the session. This is an internal function, and should not normally
// be used. You should use the DesktopLocked variable to control the session
// lock state. This function is only invoked from the DesktopLocked subscriber
// which is registerd by SetupLocker.
function lock_session() {
  if (lock != undefined) {
    return
  }

  const user_input = Variable("")
  CurrentPamMessage.set("")
  CurrentPamState.set(PamState.IDLE)

  lock = GtkSessionLock.prepare_lock()
  lock.lock_lock()

  unregister_display_signals = RegisterPerMonitorWindows(window_registry, (monitor) => {
    const window = SetupLockerShade(monitor, user_input)
    lock!.new_surface(window, monitor)
    window.show_all()
    return window
  })

  // We start authentication here. This should cause pam to invoke our connected
  // signal to prompt for input from the user. This normally means prompting for the
  // password, but could also be something like "Place your finger on the fingerpint sensor"
  // or whatever.
  pam.start_authenticate()
}

// Unlock the session. This is an internal function, and should not normally
// be used. You should use the DesktopLocked variable to control the session
// lock state. This function is only invoked from the DesktopLocked subscriber
// which is registerd by SetupLocker.
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

  pam.connect("auth-error", (_, message) => {
    CurrentPamMessage.set(message)
    CurrentPamState.set(PamState.FAILED)
  })

  pam.connect("auth-info", (_, message) => {
    CurrentPamMessage.set(message)
  })

  pam.connect("auth-prompt-visible", (_, message) => {
    CurrentPamMessage.set(message)
    CurrentPamState.set(PamState.WAITING_VISIBLE)
  })

  pam.connect("auth-prompt-hidden", (_, message) => {
    CurrentPamMessage.set(message)
    CurrentPamState.set(PamState.WAITING_HIDDEN)
  })

  pam.connect("fail", (_, message) => {
    CurrentPamMessage.set(message)
    CurrentPamState.set(PamState.FAILED)

    // Let the user actually see the failure message, and then
    // start authentication again, which just starts the whole
    // process over.
    timeout(2000, () => pam.start_authenticate())
  })

  pam.connect("success", (_) => {
    CurrentPamMessage.set("")
    CurrentPamState.set(PamState.SUCCESS)
    SessionLocked.set(false)
  })

  SessionLocked.subscribe((locked) => {
    if (locked) {
      lock_session()
    } else {
      unlock_session()
    }
  })
}
