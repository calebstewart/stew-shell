import { Variable } from "astal"
import { Gtk } from "astal/gtk3"
import { bind } from "astal/binding"
import { timeout } from "astal/time"
import Wp from "gi://AstalWp"

import BarItem from "./item"

const audio = Wp.get_default()!.audio

export function ListeningIndicator() {
  // Create a variable which will control revealing the label
  // This is separate from revealing the icon.
  const reveal = Variable(false)

  // When a new recorder is added, show the label. The label
  // will then automatically hide again after 3 seconds. This
  // gives a visual indication of a new listener if the icon
  // was already visible on screen.
  const recorderConnectId = audio.connect("recorder-added", (_audio, _endpoint) => {
    reveal.set(true)
    timeout(3000, () => reveal.set(false))
  })

  // Wrap the tray icon in a revealer. We don't want or need a microphone icon unless
  // something is recording, so only show the icon when recorders are present.
  return <revealer
    reveal_child={bind(audio, "recorders").as((recorders) => recorders.length > 0)}
    transition_type={Gtk.RevealerTransitionType.SLIDE_RIGHT}
    onDestroy={() => audio.disconnect(recorderConnectId)} >
    <BarItem
      className={bind(audio.default_microphone, "mute").as((muted) => (
        muted ? "ListeningIndicator muted" : "ListeningIndicator unmuted"
      ))}
      onButtonReleaseEvent={(_widget, event) => {
        const [has_button, button] = event.get_button()
        if (!has_button || button != 1) {
          return
        }

        audio.default_microphone.set_mute(!audio.default_microphone.get_mute())
      }}
      reveal={bind(reveal)}>
      <label className="fa-solid" label={bind(audio.default_microphone, "mute").as((muted) => (
        muted ? "\uf539" : "\uf3c9"
      ))} />
      <label label={bind(audio, "recorders").as((recorders) => {
        if (recorders.length == 0) {
          return "No listeners"
        } else if (recorders.length == 1) {
          return recorders[0].name
        } else {
          return `${recorders.length} Listening`
        }
      })} />
    </BarItem>
  </revealer>
}
