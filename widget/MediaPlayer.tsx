import { Variable } from "astal"
import { Astal, Gtk } from "astal/gtk3"
import Mpris from "gi://AstalMpris"
import { bind } from "astal"

function lengthStr(length: number) {
  const min = Math.floor(length / 60)
  const sec = Math.floor(length % 60)
  const sec0 = sec < 10 ? "0" : ""
  return `${min}:${sec0}${sec}`
}


function MediaPlayer({ player }: { player: Mpris.Player }) {
  const { START, END } = Gtk.Align

  const title = bind(player, "title").as(t =>
    t || "Unknown Track")

  const artist = bind(Variable.derive([bind(player, "artist"), bind(player, "album")], (artist, album) => {
    var albumName = ""
    if (album) {
      albumName = ` - ${album}`
    }

    return `${artist || "Unknown Artist"}${albumName}`
  }))

  const coverArt = bind(player, "coverArt").as(c =>
    `background-image: url('${c}')`)

  const playerIcon = bind(player, "entry").as(e =>
    Astal.Icon.lookup_icon(e) ? e : "audio-x-generic-symbolic")

  const position = bind(player, "position").as(p => player.length > 0
    ? p / player.length : 0)

  const playIcon = bind(player, "playbackStatus").as(s =>
    s === Mpris.PlaybackStatus.PLAYING
      ? "media-playback-pause-symbolic"
      : "media-playback-start-symbolic"
  )

  return <box className="MediaPlayer">
    <box className="cover-art" css={coverArt} />
    <box vertical>
      <box className="title">
        <label truncate hexpand halign={START} label={title} />
        <icon className="player-icon" icon={playerIcon} css="margin: 0.5rem" />
        <button className="player-close" visible={bind(player, "canQuit")} onClicked={() => player.quit()}>
          <icon icon="window-close-symbolic" />
        </button>
      </box>
      <label halign={START} valign={START} vexpand wrap label={artist} />
      <slider
        visible={bind(player, "length").as(l => l > 0)}
        onDragged={({ value }) => player.position = value * player.length}
        value={position}
      />
      <centerbox className="actions">
        <label
          hexpand
          className="position"
          halign={START}
          visible={bind(player, "length").as(l => l > 0)}
          label={bind(player, "position").as(lengthStr)}
        />
        <box>
          <button
            onClicked={() => player.previous()}
            visible={bind(player, "canGoPrevious")}>
            <icon icon="media-skip-backward-symbolic" />
          </button>
          <button
            onClicked={() => player.stop()}
            visible={bind(player, "canControl")}>
            <icon icon="media-playback-stop-symbolic" />
          </button>
          <button
            onClicked={() => player.play_pause()}
            visible={bind(player, "canControl")}>
            <icon icon={playIcon} />
          </button>
          <button
            onClicked={() => player.next()}
            visible={bind(player, "canGoNext")}>
            <icon icon="media-skip-forward-symbolic" />
          </button>
        </box>
        <label
          className="length"
          hexpand
          halign={END}
          visible={bind(player, "length").as(l => l > 0)}
          label={bind(player, "length").as(l => l > 0 ? lengthStr(l) : "0:00")}
        />
      </centerbox>
    </box>
  </box>
}

export default function MprisPlayers(mpris: Mpris.Mpris) {
  return <box vertical>
    {bind(mpris, "players").as(arr => arr.flatMap(player => [
      <Gtk.Separator visible />,
      <MediaPlayer player={player} />
    ]).slice(1))}
  </box>
}
