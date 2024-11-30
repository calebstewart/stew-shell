import { Gio, GLib, bind } from "astal"
import { Astal, Gtk } from "astal/gtk3"
import Notifd from "gi://AstalNotifd"

const Align = Gtk.Align

function IconExists(icon: string | null | undefined) {
  return icon && !!Astal.Icon.lookup_icon(icon)
}

function PathExists(path: string | null | undefined) {
  return path && GLib.file_test(path, GLib.FileTest.EXISTS)
}

function FormatTime(t: number, format: string = "%H:%M") {
  return GLib.DateTime.new_from_unix_local(t).format(format)!
}

function UrgencyToString(u: Notifd.Urgency) {
  switch (u) {
    case Notifd.Urgency.LOW:
      return "low"
    case Notifd.Urgency.CRITICAL:
      return "critical"
    case Notifd.Urgency.NORMAL:
    default:
      return "normal"
  }
}

function ResolveDesktopEntry(n: Notifd.Notification): Gio.DesktopAppInfo | null {
  var entry = null
  if (n.desktop_entry !== null) {
    entry = Gio.DesktopAppInfo.new(`${n.desktop_entry}.desktop`)
  }

  if (entry === null) {
    entry = Gio.DesktopAppInfo.new(`${n.app_name}.desktop`)
  }

  if (entry === null) {
    entry = Gio.DesktopAppInfo.new(`${n.app_name.toLowerCase()}.desktop`)
  }

  return entry
}

export interface NotificationProps {
  notification: Notifd.Notification,
  onDismissed?: (self: Gtk.Widget, notification: Notifd.Notification) => void,
};

export default function Notification({
  notification,
  onDismissed,
}: NotificationProps) {
  const desktopEntry = ResolveDesktopEntry(notification)
  const icon = desktopEntry?.get_string("Icon") || notification.app_icon
  const appName = desktopEntry?.get_name() || notification.app_name

  return <eventbox
    className={bind(notification, "urgency").as((u) => `Notification ${UrgencyToString(u)}`)}>
    <box vertical>
      <box className="header">
        {icon && <icon
          className="app-icon"
          visible={Boolean(icon)}
          icon={icon}
        />}
        <label
          className="app-name"
          halign={Align.START}
          truncate
          label={appName || "Unknown"}
        />
        <label
          className="time"
          hexpand
          halign={Align.END}
          label={FormatTime(notification.time)}
        />
        <button onClicked={(widget) => onDismissed && onDismissed(widget, notification)}>
          <icon icon="window-close-symbolic" />
        </button>
      </box>
      <Gtk.Separator visible />
      <box className="content">
        {PathExists(notification.image) && <box
          valign={Align.START}
          className="image"
          css={`background-image: url('${notification.image}')`}
        />}
        {IconExists(notification.image) && <box
          expand={false}
          valign={Align.START}
          className="icon-image">
          <icon icon={notification.image} expand halign={Align.CENTER} valign={Align.CENTER} />
        </box>}
        <box vertical>
          <label
            className="summary"
            halign={Align.START}
            xalign={0}
            label={notification.summary}
            truncate
          />
          {notification.body && <label
            className="body"
            halign={Align.START}
            xalign={0}
            label={notification.body}
            truncate
          />}
        </box>
      </box>
      {notification.get_actions().length > 0 && <box className="actions">
        {notification.get_actions().map(({ label, id }) => (
          <button
            hexpand
            onClicked={() => notification.invoke(id)}>
            <label label={label} halign={Align.CENTER} hexpand />
          </button>
        ))}
      </box>}
    </box>
  </eventbox >
}

