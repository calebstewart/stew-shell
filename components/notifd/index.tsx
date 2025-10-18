import { Astal, Gtk, Gdk } from "ags/gtk4"
import { Accessor, For, createBinding, createState, createComputed } from "ags"

import Gio from "gi://Gio?version=2.0"
import GLib from "gi://GLib?version=2.0"
import GSound from "gi://GSound?version=1.0"
import AstalNotifd from "gi://AstalNotifd"

const [DoNotDisturb, SetDoNotDisturb] = createState(false)

// Resolve the Gio.DesktopAppInfo for the given notification object. This function
// will attempt to locate the appropriate application information based on details
// in the notification. If the notification provides a desktop entry name, we attempt
// to append ".desktop" to it and load it with Gio.DesktopAppInfo.new. If this fails,
// we attempt to do the same with the app_name. Lastly, we try the app_name but
// lower-cased. If no entry can be found, we return null.
function resolveDesktopEntry(notification: AstalNotifd.Notification): Gio.DesktopAppInfo | null {
  var entry: Gio.DesktopAppInfo | null = null

  if (notification.desktop_entry !== null) {
    entry = Gio.DesktopAppInfo.new(`${notification.desktop_entry}.desktop`)
  }

  if (entry === null) {
    entry = Gio.DesktopAppInfo.new(`${notification.app_name}.desktop`)
  }

  if (entry === null) {
    entry = Gio.DesktopAppInfo.new(`${notification.app_name.toLowerCase()}.desktop`)
  }

  return entry
}

// Check if the given path exists. The function returns false if the path is null or
// undefined.
function pathExists(path: string | null | undefined): boolean {
  return path !== null && path !== undefined && GLib.file_test(path, GLib.FileTest.EXISTS)
}

function iconExists(icon: string | null | undefined): boolean {
  const iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default()!)

  return icon !== null && icon !== undefined && iconTheme.has_icon(icon)
}

function NotificationImage({ image }: { image: string | null | undefined }) {
  if (image === null || image === undefined) {
    return <box class="image" visible={false} />
  } else if (pathExists(image)) {
    return <image file={image} valign={Gtk.Align.START} />
  } else if (iconExists(image)) {
    return <box valign={Gtk.Align.START} class="icon-image">
      <image
        icon_name={image}
        hexpand={true} vexpand={true}
        halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER} />
    </box>
  } else {
    return <box class="image" visible={false} />
  }
}

export function Notification({ notification }: {
  notification: AstalNotifd.Notification,
}) {
  const desktopEntry = resolveDesktopEntry(notification)
  const icon = desktopEntry?.get_string("Icon") || notification.app_icon
  const appName = desktopEntry?.get_name() || notification.app_name || "Unknown Application"
  const time = GLib.DateTime.new_from_unix_local(notification.time)
  const actions = createBinding(notification, "actions")
  const gesture = new Gtk.GestureClick()

  const actionsWithoutDefault = actions((actions) => {
    if (actions === null || actions === undefined || actions.length === 0) {
      return []
    }

    const defaultAction = notification.actions.find((a) => a.id === "default")
    if (defaultAction === undefined) {
      return actions.slice(1)
    } else {
      return actions.filter((action) => action.id !== "default")
    }
  })

  const hasNonDefaultActions = actionsWithoutDefault((actions) => actions.length > 0)

  const onClick = () => {
    if (notification.actions.length === 0) {
      return
    }

    const defaultAction = notification.actions.find((a) => a.id === "default")
    const first = notification.actions[0]
    const action = defaultAction || first

    notification.invoke(action.id)
  }

  const gestureIds = [
    gesture.connect("pressed", onClick),
  ];

  const setup = (self: Gtk.Box) => {
    self.add_controller(gesture)
  }

  const destroy = (self: Gtk.Box) => {
    gestureIds.forEach((id) => gesture.disconnect(id))
    self.remove_controller(gesture)
  }

  return <box class="notification" orientation={Gtk.Orientation.VERTICAL} hexpand={true} vexpand={false} onDestroy={destroy} $={setup}>
    <centerbox class="toolbar">
      <box $type="start" orientation={Gtk.Orientation.HORIZONTAL}>
        <image class="icon" icon_name={icon} visible={Boolean(icon)} valign={Gtk.Align.CENTER} />
        <label class="header" label={notification.summary} halign={Gtk.Align.START} valign={Gtk.Align.CENTER} />
        <label class="subheader" label={` from ${appName}`} valign={Gtk.Align.CENTER} />
      </box>
      <box $type="end" orientation={Gtk.Orientation.HORIZONTAL}>
        <label class="time" label={time.format("%R")!} />
        <button
          tooltip_text="Dismiss"
          icon_name="window-close-symbolic"
          onClicked={() => notification.dismiss()} />
      </box>
    </centerbox>
    <Gtk.Separator visible={true} />
    <box class="content">
      <NotificationImage image={notification.image} />
      <box orientation={Gtk.Orientation.VERTICAL}>
        <label
          class="body"
          label={notification.body}
          visible={Boolean(notification.body)}
          halign={Gtk.Align.START}
          xalign={0} />
      </box>
    </box>
    <box class="actions" visible={hasNonDefaultActions}>
      <For each={actionsWithoutDefault}>
        {(action) => (
          <button onClicked={() => notification.invoke(action.id)} label={createBinding(action, "label")} />
        )}
      </For>
    </box>
  </box>
}

export function NotificationCenter({ gdkmonitor }: {
  gdkmonitor: Gdk.Monitor,
  index: Accessor<number>,
}) {
  const notifd = AstalNotifd.get_default()
  const notifications = createBinding(notifd, "notifications")
  const hasNotifications = notifications((v) => v.length > 0)
  const sound = new GSound.Context()
  const dontDisturb = createBinding(notifd, "dont_disturb")
  const visible = createComputed([hasNotifications, dontDisturb], (hasNotifications, dontDisturb) => hasNotifications && !dontDisturb)

  sound.init(null)

  const notifdConnectionIDs = [
    notifd.connect("notified", () => {
      if (notifd.dont_disturb) {
        return
      }

      sound.play_simple({
        [GSound.ATTR_EVENT_ID]: "bell",
      }, null)
    })
  ]

  return <window
    name="NotificationCenter"
    class="notification-center"
    gdkmonitor={gdkmonitor}
    exclusivity={Astal.Exclusivity.NORMAL}
    anchor={Astal.WindowAnchor.RIGHT | Astal.WindowAnchor.TOP}
    visible={visible}
    onDestroy={() => notifdConnectionIDs.forEach((id) => notifd.disconnect(id))}>
    <box class="container" orientation={Gtk.Orientation.VERTICAL}>
      <For each={notifications}>
        {(notification) => <revealer reveal_child={true} transition_type={Gtk.RevealerTransitionType.SLIDE_LEFT}>
          <Notification notification={notification} />
        </revealer>}
      </For>
    </box>
  </window >
}
