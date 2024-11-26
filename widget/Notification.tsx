import { Gio, GLib } from "astal"
import { Astal, Gtk } from "astal/gtk3"
import Notifd from "gi://AstalNotifd"

type Props = {
  setup(self: Gtk.Widget): void,
  onHoverLost(self: Gtk.Widget): void,
  notification: Notifd.Notification,
};

const isIcon = (icon: string) =>
  !!Astal.Icon.lookup_icon(icon)

const fileExists = (path: string) =>
  GLib.file_test(path, GLib.FileTest.EXISTS)

const time = (time: number, format = "%H:%M") => GLib.DateTime
  .new_from_unix_local(time)
  .format(format)!

const urgency = (n: Notifd.Notification) => {
  const { LOW, NORMAL, CRITICAL } = Notifd.Urgency
  // match operator when?
  switch (n.urgency) {
    case LOW: return "low"
    case CRITICAL: return "critical"
    case NORMAL:
    default: return "normal"
  }
}

export default function Notification(props: Props) {
  const { notification: n, onHoverLost, setup } = props
  const { START, CENTER, END } = Gtk.Align
  var icon = n.appIcon
  var appName = n.appName

  var desktopEntry = null
  if (n.desktopEntry !== null) {
    desktopEntry = Gio.DesktopAppInfo.new(`${n.desktopEntry}.desktop`)
  }

  if (desktopEntry === null) {
    desktopEntry = Gio.DesktopAppInfo.new(`${n.appName}.desktop`)
  }

  if (desktopEntry === null) {
    desktopEntry = Gio.DesktopAppInfo.new(`${n.appName.toLowerCase()}.desktop`)
  }

  if (!n.appIcon && desktopEntry !== null && desktopEntry.has_key("Icon")) {
    const desktopIcon = desktopEntry.get_string("Icon")
    if (desktopIcon !== null) {
      icon = desktopIcon
    }
  }

  if (desktopEntry !== null && desktopEntry.has_key("Name")) {
    appName = desktopEntry.get_string("Name") || appName
  }

  return <eventbox
    className={`Notification ${urgency(n)}`}
    setup={setup}
    onHoverLost={onHoverLost}>
    <box vertical>
      <box className="header">
        {icon && <icon
          className="app-icon"
          visible={Boolean(icon)}
          icon={icon}
        />}
        <label
          className="app-name"
          halign={START}
          truncate
          label={appName || "Unknown"}
        />
        <label
          className="time"
          hexpand
          halign={END}
          label={time(n.time)}
        />
        <button onClicked={() => n.dismiss()}>
          <icon icon="window-close-symbolic" />
        </button>
      </box>
      <Gtk.Separator visible />
      <box className="content">
        {n.image && fileExists(n.image) && <box
          valign={START}
          className="image"
          css={`background-image: url('${n.image}')`}
        />}
        {n.image && isIcon(n.image) && <box
          expand={false}
          valign={START}
          className="icon-image">
          <icon icon={n.image} expand halign={CENTER} valign={CENTER} />
        </box>}
        <box vertical>
          <label
            className="summary"
            halign={START}
            xalign={0}
            label={n.summary}
            truncate
          />
          {n.body && <label
            className="body"
            halign={START}
            xalign={0}
            label={n.body}
            truncate
          />}
        </box>
      </box>
      {n.get_actions().length > 0 && <box className="actions">
        {n.get_actions().map(({ label, id }) => (
          <button
            hexpand
            onClicked={() => n.invoke(id)}>
            <label label={label} halign={CENTER} hexpand />
          </button>
        ))}
      </box>}
    </box>
  </eventbox>
}

