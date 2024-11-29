import { Variable } from "astal"
import { bind } from "astal/binding"
import { timeout } from "astal/time"
import Wp from "gi://AstalWp"
import TrayIcon from "./TrayIcon"

const audio = Wp.get_default()!.audio

export function ListeningIndicator() {
  const reveal = Variable(false)

  audio.connect("recorder-added", (_audio, _endpoint) => {
    reveal.set(true)
    timeout(3000, () => reveal.set(false))
  })

  return TrayIcon({
    className: bind(audio.default_microphone, "mute").as((muted) => {
      if (muted) {
        return "ListeningIndicator muted"
      } else {
        return "ListeningIndicator unmuted"
      }
    }),
    icon: <label className="fa-solid" label={bind(audio.default_microphone, "mute").as((muted) => {
      return muted ? "\uf539" : "\uf3c9"
    })} />,
    label: bind(audio, "recorders").as((recorders) => {
      if (recorders.length == 0) {
        return "No listeners"
      } else if (recorders.length == 1) {
        return recorders[0].name
      } else {
        return `${recorders.length} Listening`
      }
    }),
    onButtonReleased: () => {
      audio.default_microphone.set_mute(!audio.default_microphone.get_mute())
    },
    visible: bind(audio, "recorders").as((recorders) => recorders.length > 0),
    lockReveal: bind(reveal),
  })
}
