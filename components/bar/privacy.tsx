import { Accessor, createBinding, createState, createComputed } from "ags"
import { Timer } from "ags/time"
import { Gtk, Gdk } from "ags/gtk4"
import { timeout } from "ags/time"
import Wp from "gi://AstalWp"

import { ICON_MICROPHONE_LINES, ICON_MICROPHONE_LINES_SLASH, ICON_VIDEO } from "../fontawesome"

export function ListeningIndicator({ reveal }: {
  reveal: Accessor<boolean>,
}) {
  const audio = Wp.get_default().audio
  const muted = createBinding(audio.default_microphone, "mute")
  const icon = muted((m) => m ? ICON_MICROPHONE_LINES_SLASH : ICON_MICROPHONE_LINES)
  const recorders = createBinding(audio, "recorders")
  const hasRecorders = recorders((v: Wp.Stream[]) => v.length > 0)
  const [newRecorderReveal, setNewRecorderReveal] = createState(false)

  const computedReveal = createComputed([
    newRecorderReveal,
    reveal,
  ], (new_recorder: boolean, revealed: boolean) => new_recorder || revealed)

  var newRecorderTimer: Timer | null = null;
  const unsubRecorders = recorders.subscribe(() => {
    if (newRecorderTimer !== null) {
      newRecorderTimer.cancel()
    }

    setNewRecorderReveal(true)
    newRecorderTimer = timeout(3000, () => {
      setNewRecorderReveal(false)
      newRecorderTimer = null
    })
  })

  const details = recorders((recorders: Wp.Stream[]) => {
    if (recorders.length > 1) {
      return `${recorders.length} listeners`
    } else if (recorders.length == 1) {
      return recorders[0].name
    } else {
      return "No listeners"
    }
  })

  const classes = muted((muted) => muted ? "PrivacyIndicator muted" : "PrivacyIndicator unmuted")

  return <revealer reveal_child={hasRecorders} transition_type={Gtk.RevealerTransitionType.SLIDE_LEFT} onDestroy={unsubRecorders}>
    <box class={classes}>
      <label class="fa-solid" label={icon} />
      <revealer reveal_child={computedReveal} transition_type={Gtk.RevealerTransitionType.SLIDE_LEFT}>
        <label label={details} />
      </revealer>
    </box>
  </revealer>
}

export function VideoRecordingIndicator({ reveal }: {
  reveal: Accessor<boolean>,
}) {
  const video = Wp.get_default().video
  const icon = ICON_VIDEO
  const recorders = createBinding(video, "recorders")
  const hasRecorders = recorders((v: Wp.Stream[]) => v.length > 0)
  const [newRecorderReveal, setNewRecorderReveal] = createState(false)

  const computedReveal = createComputed([
    newRecorderReveal,
    reveal,
  ], (new_recorder: boolean, revealed: boolean) => new_recorder || revealed)

  var newRecorderTimer: Timer | null = null;
  const unsubRecorders = recorders.subscribe(() => {
    if (newRecorderTimer !== null) {
      newRecorderTimer.cancel()
    }

    setNewRecorderReveal(true)
    newRecorderTimer = timeout(3000, () => {
      setNewRecorderReveal(false)
      newRecorderTimer = null
    })
  })

  const details = recorders((recorders: Wp.Stream[]) => {
    if (recorders.length > 1) {
      return `${recorders.length} viewers`
    } else if (recorders.length == 1) {
      return recorders[0].name
    } else {
      return "No viewers"
    }
  })

  const classes = "PrivacyIndicator unmuted"

  return <revealer reveal_child={hasRecorders} transition_type={Gtk.RevealerTransitionType.SLIDE_LEFT} onDestroy={unsubRecorders}>
    <box class={classes}>
      <label class="fa-solid" css="padding-right: 1rem;" label={icon} />
      <revealer reveal_child={computedReveal} transition_type={Gtk.RevealerTransitionType.SLIDE_LEFT}>
        <label label={details} />
      </revealer>
    </box>
  </revealer>
}
