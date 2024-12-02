import { Variable } from "astal"
import { Astal, Gtk } from "astal/gtk3"
import Mpris from "gi://AstalMpris"
import { bind } from "astal"

const Align = Gtk.Align
const mpris = Mpris.get_default()

// Format a time string from a duration in seconds.
// The returned string is normally in MM:SS format,
// but could be in HH:MM:SS if necessary.
function FormatTime(duration: number) {
  var hours: number | string = Math.floor(duration / 3600)
  var seconds: number | string = Math.floor(duration % 3600)
  var minutes: number | string = Math.floor(seconds / 60)
  seconds = Math.floor(seconds % 60)

  if (hours < 10) {
    hours = `0${hours}`
  }

  if (seconds < 10) {
    seconds = `0${seconds}`
  }

  if (minutes < 10) {
    minutes = `0${minutes}`
  }

  if (hours === "00") {
    return `${minutes}:${seconds}`
  } else {
    return `${hours}:${minutes}:${seconds}`
  }
}

export interface MediaPlayerProps {
  player: Mpris.Player
}

export function MediaPlayer({ player }: MediaPlayerProps) {
  const artistAndAlbum = Variable.derive([bind(player, "artist"), bind(player, "album")], (maybeArtist, album) => {
    const artist = maybeArtist || "Unknown Artist"
    return album ? `${artist} - ${album}` : artist
  })

  return <box className="MediaPlayer" onDestroy={() => artistAndAlbum.drop()}>
    <box
      className="cover-art"
      css={bind(player, "cover_art").as((url) => `background-image: url('${url}')`)} />
    <box vertical>
      <box className="title">
        <label
          truncate
          hexpand
          halign={Align.START}
          label={bind(player, "title").as(t => t || "Unknown Track")} />
        <icon
          className="player-icon"
          icon={bind(player, "entry").as(e => Astal.Icon.lookup_icon(e) ? (e || "audio-x-generic-symbolic") : "audio-x-generic-symbolic")} />
        <button
          className="player-close"
          visible={bind(player, "can_quit")}
          onClicked={() => player.quit()}>
          <icon icon="window-close-symbolic" />
        </button>
      </box>
      <label
        halign={Align.START}
        valign={Align.START}
        vexpand
        wrap
        label={bind(artistAndAlbum)} />
      <slider
        visible={bind(player, "length").as(l => l > 0)}
        onDragged={({ value }) => player.position = value * player.length}
        value={bind(player, "position").as((p) => player.length > 0 ? p / player.length : 0)} />
      <centerbox className="actions">
        <label
          hexpand
          className="position"
          halign={Align.START}
          visible={bind(player, "length").as(l => l > 0)}
          label={bind(player, "position").as(FormatTime)}
        />
        <box>
          <button
            onClicked={() => player.previous()}
            visible={bind(player, "can_go_previous")}>
            <icon icon="media-skip-backward-symbolic" />
          </button>
          <button
            onClicked={() => player.stop()}
            visible={bind(player, "can_control")}>
            <icon icon="media-playback-stop-symbolic" />
          </button>
          <button
            onClicked={() => player.play_pause()}
            visible={bind(player, "can_control")}>
            <icon icon={bind(player, "playback_status").as((status) => (
              status === Mpris.PlaybackStatus.PLAYING
                ? "media-playback-pause-symbolic"
                : "media-playback-start-symbolic"
            ))} />
          </button>
          <button
            onClicked={() => player.next()}
            visible={bind(player, "can_go_next")}>
            <icon icon="media-skip-forward-symbolic" />
          </button>
        </box>
        <label
          className="length"
          hexpand
          halign={Align.END}
          visible={bind(player, "length").as(l => l > 0)}
          label={bind(player, "length").as(l => l > 0 ? FormatTime(l) : "00:00")}
        />
      </centerbox>
    </box>
  </box>
}

export interface MediaPlayersProps { }

export default function MediaPlayers(_: MediaPlayersProps) {
  return <box className="MediaPlayers" vertical>
    {bind(mpris, "players").as(players => players.flatMap(player => [
      <Gtk.Separator visible />,
      <MediaPlayer player={player} />,
    ]).slice(1))}
  </box>
}
