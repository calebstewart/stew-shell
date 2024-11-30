import { bind } from "astal"
import Wp from "gi://AstalWp"

const audio = Wp.get_default()!.audio

export interface EndpointControlProps {
  endpoint: Wp.Endpoint
}

export function EndpointControl({ endpoint }: EndpointControlProps) {
  return <box className="EndpointControl">
    <label
      className="EndpointControlLabel"
      label={bind(endpoint, "description").as(String)} />
    <button
      className="EndpointControlMute"
      onClicked={() => endpoint.mute = !endpoint.mute}>
      <icon icon={bind(endpoint, "volume_icon").as(String)} />
    </button>
    <slider
      hexpand
      onDragged={({ value }) => endpoint.volume = value}
      value={bind(endpoint, "volume")} />
  </box>
}

export interface AudioControlsProps { }

export default function AudioControls(_: AudioControlsProps) {
  return <box className="AudioControls">
    <EndpointControl endpoint={audio.default_speaker} />
  </box>
}
