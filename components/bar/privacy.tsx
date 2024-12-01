import { Variable } from "astal"
import { Gtk, Gdk } from "astal/gtk3"
import { bind } from "astal/binding"
import { timeout } from "astal/time"
import Wp from "gi://AstalWp"

import { AstalMenu, AstalMenuItem } from "../builtin"
import BarItem from "./item"

const wp = Wp.get_default()!
const audio = wp.audio
const video = wp.video

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

  const recorder_menu = <AstalMenu
    onHide={() => reveal.set(false)}
    className="AudioRecorderMenu">
    {bind(audio, "recorders").as((recorders: Wp.Endpoint[] | null) => recorders?.map((recorder) => {
      const label = Variable.derive(
        [bind(recorder, "name"), bind(recorder, "description")],
        (name, description) => {
          return `${description} - ${name}`
        }
      )

      return <AstalMenuItem
        onDestroy={() => label.drop()}
        onActivate={() => {
          recorder.mute = !recorder.mute
        }}>
        <box>
          <icon icon={bind(recorder, "volume_icon").as(String)} />
          <label label={bind(label)} />
        </box>
      </AstalMenuItem>
    }))}
  </AstalMenu> as Gtk.Menu

  // Wrap the tray icon in a revealer. We don't want or need a microphone icon unless
  // something is recording, so only show the icon when recorders are present.
  return <revealer
    reveal_child={bind(audio, "recorders").as((recorders) => recorders.length > 0)}
    transition_type={Gtk.RevealerTransitionType.SLIDE_RIGHT}
    onDestroy={() => audio.disconnect(recorderConnectId)} >
    <BarItem
      className={bind(audio.default_microphone, "mute").as((muted) => (
        muted ? "PrivacyIndicator muted" : "PrivacyIndicator unmuted"
      ))}
      onButtonReleaseEvent={(widget, event) => {
        const [has_button, button] = event.get_button()
        if (!has_button) {
          return
        }

        switch (button) {
          case 1:
            audio.default_microphone.set_mute(!audio.default_microphone.get_mute())
            break
          case 3:
            recorder_menu.popup_at_widget(widget, Gdk.Gravity.SOUTH_WEST, Gdk.Gravity.NORTH_WEST, event)
            break
        }
      }}
      reveal={bind(reveal)}>
      <label className="fa-solid" label={bind(audio.default_microphone, "mute").as((muted) => (
        muted ? "\uf539" : "\uf3c9"
      ))} />
      <label label={bind(audio, "recorders").as((recorders) => {
        if (recorders.length == 0) {
          return "No listeners"
        } else if (recorders.length == 1) {
          return `${recorders[0].description} - ${recorders[0].name}`
        } else {
          return `${recorders.length} Listening`
        }
      })} />
    </BarItem>
  </revealer>
}

export function VideoRecordingIndicator() {
  // Create a variable which will control revealing the label
  // This is separate from revealing the icon.
  const reveal = Variable(false)

  // When a new recorder is added, show the label. The label
  // will then automatically hide again after 3 seconds. This
  // gives a visual indication of a new listener if the icon
  // was already visible on screen.
  const recorderConnectId = video.connect("recorder-added", (_audio, _endpoint) => {
    reveal.set(true)
    timeout(3000, () => reveal.set(false))
  })

  const recorder_menu = <AstalMenu
    onHide={() => reveal.set(false)}
    className="VideoRecorderMenu">
    {bind(video, "recorders").as((recorders: Wp.Endpoint[] | null) => recorders?.map((recorder) => {
      const label = Variable.derive(
        [bind(recorder, "name"), bind(recorder, "description")],
        (name, description) => {
          return `${name} - ${description}`
        }
      )

      return <AstalMenuItem
        onDestroy={() => label.drop()}>
        <box>
          <icon icon={bind(recorder, "icon").as(String)} />
          <label label={bind(label)} />
        </box>
      </AstalMenuItem>
    }))}
  </AstalMenu> as Gtk.Menu

  // Wrap the tray icon in a revealer. We don't want or need a microphone icon unless
  // something is recording, so only show the icon when recorders are present.
  return <revealer
    reveal_child={bind(video, "recorders").as((recorders) => recorders.length > 0)}
    transition_type={Gtk.RevealerTransitionType.SLIDE_RIGHT}
    onDestroy={() => {
      video.disconnect(recorderConnectId)
      recorder_menu.destroy()
    }} >
    <BarItem
      className="PrivacyIndicator unmuted"
      onButtonReleaseEvent={(widget, event) => {
        const [has_button, button] = event.get_button()
        if (!has_button) {
          return
        }

        switch (button) {
          case 3:
            recorder_menu.popup_at_widget(widget, Gdk.Gravity.SOUTH_WEST, Gdk.Gravity.NORTH_WEST, event)
            break;
        }
      }}
      reveal={bind(reveal)}>
      <label className="fa-solid" label={"\uf03d"} />
      <label label={bind(video, "recorders").as((recorders) => {
        if (recorders.length == 0) {
          return "No recorders"
        } else if (recorders.length == 1) {
          return recorders[0].name
        } else {
          return `${recorders.length} Recording`
        }
      })} />
    </BarItem>
  </revealer>
}

export default function PrivacyIndicators() {
  return [ListeningIndicator(), VideoRecordingIndicator()]
}
