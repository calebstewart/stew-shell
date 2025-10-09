import { Gtk, Gdk } from "ags/gtk4"
import { With, For, createBinding, createState } from "ags"
import { timeout } from "ags/time"

import Gio from "gi://Gio?version=2.0"
import GLib from "gi://GLib?version=2.0"
import AstalNotifd from "gi://AstalNotifd"

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

  return <box class="notification" orientation={Gtk.Orientation.VERTICAL} hexpand={true} vexpand={true}>
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
    <box class="actions">
      <For each={actions}>
        {(action) => (
          <button onClicked={() => notification.invoke(action.id)} label={createBinding(action, "label")} />
        )}
      </For>
    </box>
  </box>
}

export function NotificationCenter({ }: {}) {
  const notifd = AstalNotifd.get_default()
  const notifications = createBinding(notifd, "notifications")
  const hasNotifications = notifications((v) => v.length > 0)

  return <revealer reveal_child={hasNotifications} transition_type={Gtk.RevealerTransitionType.SLIDE_DOWN}>
    <box class="notification-center" orientation={Gtk.Orientation.VERTICAL}>
      <centerbox class="toolbar">
        <box $type="start">
          <label class="header" label="Notification Center" />
        </box>
        <box $type="center" />
        <box $type="end">
          <button icon_name="edit-clear-all-symbolic" tooltip_text="Clear All" />
        </box>
      </centerbox>
      <Gtk.Separator visible={true} />
      <box>
        <For each={notifications}>
          {(notification) => (
            <Notification notification={notification} />
          )}
        </For>
      </box>
    </box>
  </revealer>
}
