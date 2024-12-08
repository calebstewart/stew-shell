import { Variable, bind, timeout, interval, GLib } from "astal"
import { Astal, App, Gdk, Gtk } from "astal/gtk3"
import AstalIO from "gi://AstalIO"
import Auth from "gi://AstalAuth"
import GtkSessionLock from "gi://GtkSessionLock"

import { Time } from "@components/bar/clock"
import RegisterPerMonitorWindows from "@components/per-monitor"

import { LockerQuotes, GetRandomLockerQuoteIndex, RandomLockerQuoteWidget } from "./quotes"
import { Bar } from "./bar"

export const DEFAULT_PAM_SERVICE = "hyprlock"

enum PamState {
  IDLE,
  SUBMITTING,
  FAILED,
  SUCCESS,
  WAITING_VISIBLE,
  WAITING_HIDDEN,
  WAITING_OTHER,
}

function PamStateToString(s: PamState) {
  switch (s) {
    case PamState.IDLE:
      return "idle"
    case PamState.SUBMITTING:
      return "submitting"
    case PamState.FAILED:
      return "failed"
    case PamState.SUCCESS:
      return "success"
    case PamState.WAITING_OTHER:
      return "waiting-other"
    case PamState.WAITING_HIDDEN:
      return "waiting-hidden"
    case PamState.WAITING_VISIBLE:
      return "waiting-visible"
    default:
      return "unknown"
  }
}

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

  const quote_stack = <stack
    transition_type={Gtk.StackTransitionType.CROSSFADE}
    homogeneous={true}
    transition_duration={1000}
    visible_child_name="empty">
    <label className="random-quote" label="" name="empty" />
    {LockerQuotes.map((quote, index) => <label className="random-quote" label={quote} name={String(index)} />)}
  </stack> as Gtk.Stack

  const timers = new Array<AstalIO.Time>()
  timers.push(timeout(3000 + (Math.random() * 2000), () => {
    quote_stack.visible_child_name = String(GetRandomLockerQuoteIndex())
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
        quote_stack.visible_child_name = String(GetRandomLockerQuoteIndex())
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

// Lock the active session. This will handle everything from beginning to end including 
// artificially unlocking the locker when SessionLocked is set to false. It will setup
// it's own PAM context, and interact with GtkSessionLock directly. When finished, all
// top-level locker windows will be destroyed, and the PAM context destroyed. This
// function does not block or return any value. Upon return the session is locked via
// GtkSessionLock, and locker windows will be automatically created in teh background
// for all displays (active and future hot-plugged).
export function LockSession() {
  const fail_message = Variable("")
  const info_message = Variable("")
  const state = Variable("idle") // Current state of PAM client
  const pam = new Auth.Pam({
    service: DEFAULT_PAM_SERVICE,
  })
  const prompt = {
    input: Variable(""),
    message: Variable(""),
    visible: Variable(false),
  }
  const lock = GtkSessionLock.prepare_lock()

  // Connect to all the PAM signals, and update state accordingly
  const pam_connections = [
    // Authentication was successful, unlock the session
    pam.connect("success", () => SessionLocked.set(false)),
    // Handle auth failure
    pam.connect("fail", (_, msg) => {
      fail_message.set(msg)
      state.set("failed")
    }),
    // Handle auth error
    pam.connect("auth-error", (_, msg) => {
      fail_message.set(msg)
      state.set("failed")
    }),
    // Handle prompt info without text entry
    pam.connect("auth-info", (_, msg) => {
      info_message.set(msg)
      state.set("info")
    }),
    // Handle prompt for visible answer 
    pam.connect("auth-prompt-visible", (_, msg) => {
      prompt.input.set("")
      prompt.visible.set(true)
      prompt.message.set(msg)
      state.set("prompt")
    }),
    // Handle prompt for invisible answer (e.g. password)
    pam.connect("auth-prompt-hidden", (_, msg) => {
      prompt.input.set("")
      prompt.visible.set(false)
      prompt.message.set(msg)
      state.set("prompt")
    }),
  ]

  // Lock the session (initially with no visible windows)
  lock.lock_lock()

  // Register a continuous monitor binding which ensures we always have locker
  // windows for each display. This includes active current displays and future
  // hot-plugged displays. The `new Map()` call allocates a registry mapping Astal.Window's
  // to GDK monitors, but we don't need to access it directly, so we transparently allocate
  // it and pass it through to the per-monitor component.
  const unregister_display_signals = RegisterPerMonitorWindows(new Map(), (monitor) => {
    // Indicates whether we have focus, and should make the form UI visible
    const visible = Variable(false)

    return <window
      className="LockerShade"
      namespace="LockerShade"
      gdkmonitor={monitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={Anchor.TOP | Anchor.LEFT | Anchor.RIGHT | Anchor.BOTTOM}
      keymode={Astal.Keymode.ON_DEMAND}
      layer={Astal.Layer.OVERLAY}
      application={App}
      visible={false}
      onDestroy={(w) => GtkSessionLock.unmap_lock_window(w)}
      setup={(w) => {
        // Bind to the 'is-active' property which indicates whether we have top-level
        // focus for this window.
        const unsub = bind(w, "is_active").subscribe((active) => {
          visible.set(active)
        })
        w.connect("destroy", () => unsub())

        // Register the surface with the locker so we get displayed by the
        // compositor even though the session is locked. This must be done
        // before the window is realized, so we set `visible=false` above,
        // but immediately call `show_all()` after registering the surface.
        lock.new_surface(w, monitor)
        w.show_all()
      }}
      onKeyReleaseEvent={() => {
        // Transition out of failed or idle states after any keypress
        const s = state.get()
        if (s === "idle" || s === "failed") {
          // PAM should initially prompt for *something*, which will cause us
          // to transition to a new state. If this doesn't happen, then we
          // are stuck.
          pam.start_authenticate()
        }
      }}>
      <box vertical>
        <Bar />
        <box>
          <box expand visible={bind(visible).as((v) => !v)} />
          <centerbox vertical halign={Gtk.Align.CENTER} visible={bind(visible)}>
            <box valign={Gtk.Align.CENTER} />
            <stack
              className="forms"
              transition_type={Gtk.StackTransitionType.CROSSFADE}
              visible_child_name={bind(state)}
              valign={Gtk.Align.CENTER}
              hhomogeneous={true}>
              <box className="idle" name="idle" halign={Gtk.Align.CENTER}>
                <label label="Press any key to unlock..." />
              </box>
              <box className="submitting" name="submitting" halign={Gtk.Align.CENTER}>
                <label label="Submitting..." className="warning" />
              </box>
              <box className="failed" name="failed" halign={Gtk.Align.CENTER} vertical>
                <label label={bind(fail_message)} className="dangerous" />
                <label label="Press any key to try again..." />
              </box>
              <box className="success" name="success" halign={Gtk.Align.CENTER}>
                <label label="Authentication Complete!" />
              </box>
              <box className="info" name="info" halign={Gtk.Align.CENTER}>
                <label label={bind(info_message)} />
              </box>
              <box className="prompt" name="prompt" expand halign={Gtk.Align.CENTER}>
                <label label={bind(prompt.message)} />
                <entry
                  className="hidden-input"
                  placeholder_text="Response..."
                  text={bind(prompt.input)}
                  width_chars={30}
                  onChanged={(e) => prompt.input.set(e.text)}
                  visibility={bind(prompt.visible)}
                  setup={(e) => {
                    const unsubState = bind(state).subscribe(() => e.grab_focus())
                    const unsubVisible = bind(visible).subscribe(() => e.grab_focus())

                    e.connect("destroy", () => {
                      unsubState()
                      unsubVisible()
                    })
                  }}
                  onActivate={() => {
                    const input = prompt.input.get()
                    state.set("submitting")
                    prompt.input.set("")
                    pam.supply_secret(input)
                  }} />
              </box>
            </stack>
            <box />
          </centerbox>
        </box>
        <RandomLockerQuoteWidget />
      </box>
    </window>
  })

  const unsub = SessionLocked.subscribe((v) => {
    if (v) {
      return
    }

    // Remove all the pam listeners
    pam_connections.forEach((c) => pam.disconnect(c))

    // Unlock the session
    lock.unlock_and_destroy()

    // Unregister and destroy all locker windows
    unregister_display_signals()

    // Unsubscribe from the session locked variable
    unsub()
  })
}

export default function SetupLocker() {
  if (!GtkSessionLock.is_supported()) {
    console.warn("ext-session-lock-v1 is not supported your compositor; session lock functionality is disabled")
    return
  }

  // Any time SessionLocked is set to true, lock the session
  SessionLocked.subscribe((locked) => locked && LockSession())
}
