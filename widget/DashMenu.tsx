import { Variable, GObject, Gio, GLib } from "astal"
import { timeout } from "astal/time"
import { Astal, Gdk, Gtk, astalify, App } from "astal/gtk3"
import Binding, { bind } from "astal/binding"
import Notifd from "gi://AstalNotifd"
import Notification from "./Notification"
import NotificationPopup, { HideNotificationPopup } from "./NotificationPopup"
import Bluetooth from "gi://AstalBluetooth"
import Network from "gi://AstalNetwork"
import { DoNotDisturb } from "./NotificationPopup"
import Mpris from "gi://AstalMpris"
import MprisPlayers from "./MediaPlayer"
import Wp from "gi://AstalWp"
import Hyprland from "gi://AstalHyprland"
import { FindGdkMonitor, CurrentGdkMonitor } from "./Hyprland"
import { ToggleButton } from "./Builtin"
import PopupCloser from "./Popup"

const bluetooth = Bluetooth.get_default()
const network = Network.get_default()

type Props = {
  GdkMonitor: Gdk.Monitor | Binding<Gdk.Monitor | undefined>,
}

function Header(): Gtk.Widget {
  return <box className="header" hexpand>
    <label halign={Gtk.Align.START} hexpand label="System Menu" />
  </box>
}

function QuickToggle(className: string, label: string) {
  return <ToggleButton className="QuickSettingsToggle">
    <label justify={Gtk.Justification.CENTER} wrap label={label} />
  </ToggleButton> as Gtk.ToggleButton
}

function DoNotDisturbToggle() {
  const button = QuickToggle("DoNotDisturbToggle", "Do Not Disturb")
  button.connect("toggled", () => {
    DoNotDisturb.set(button.active)
  })
  return button
}

function IdleInhibitToggle() {
  const button = QuickToggle("IdleInhibitToggle", "Auto-Lock")
  const session = Gio.DBus.session;
  var inhibitCookie: number | null = null

  button.active = true;
  button.connect("toggled", () => {
    if (!button.active) {
      // When the toggle is inactive, we have disabled the auto-lock,
      // so send the Inhibit request
      session.call(
        "org.freedesktop.ScreenSaver",
        "/org/freedesktop/ScreenSaver",
        "org.freedesktop.ScreenSaver",
        "Inhibit",
        GLib.Variant.new_tuple([GLib.Variant.new_string("stew-shell"), GLib.Variant.new_string("Requested by user")]),
        GLib.VariantType.new("(u)"),
        Gio.DBusCallFlags.ALLOW_INTERACTIVE_AUTHORIZATION,
        -1,
        null,
        (_conn, result) => {
          const retVal = session.call_finish(result)
          const cookieVariant = retVal.get_child_value(0)
          inhibitCookie = cookieVariant.get_uint32()
        }
      )
    } else if (inhibitCookie != null) {
      // Otherwise, if we have an inhibit cookie, then release the inhibition
      const params = GLib.Variant.new_tuple([GLib.Variant.new_uint32(inhibitCookie)])
      inhibitCookie = null

      session.call(
        "org.freedesktop.ScreenSaver",
        "/org/freedesktop/ScreenSaver",
        "org.freedesktop.ScreenSaver",
        "UnInhibit",
        params,
        null,
        Gio.DBusCallFlags.ALLOW_INTERACTIVE_AUTHORIZATION,
        -1,
        null,
        (_conn, result) => session.call_finish(result)
      )
    }
  })

  return button
}

function BluetoothToggle() {
  const button = QuickToggle("BluetoothToggle", "Bluetooth")

  // Bind the adapter power state to the toggle button. This means that
  // even if it is changed externally, the button will maintain the correct
  // state.
  bluetooth.adapter.bind_property(
    "powered", // Sync the 'powered' property of the adapter
    button, "active", // to the 'active' property of the button
    GObject.BindingFlags.BIDIRECTIONAL // sync both directions
    | GObject.BindingFlags.SYNC_CREATE // sync immediately on creation
  )

  return button
}

function WirelessToggle() {
  const button = QuickToggle("WirelessToggle", "Wi-Fi")

  network.wifi.bind_property(
    "enabled",
    button, "active",
    GObject.BindingFlags.BIDIRECTIONAL | GObject.BindingFlags.SYNC_CREATE
  )

  return button
}

function VolumeControl() {
  const wp = Wp.get_default()
  if (wp === null) {
    return null
  }

  const speaker = wp.audio.defaultSpeaker
  const slider = <slider expand />
  const binding = speaker.bind_property(
    "volume",
    slider, "value",
    GObject.BindingFlags.BIDIRECTIONAL | GObject.BindingFlags.SYNC_CREATE
  )

  return <box className="VolumeControl" onDestroy={() => binding.unbind()}>
    <label className="speaker-label" label={bind(speaker, "description").as(String)} />
    <button className="speaker-mute" onClicked={() => speaker.mute = !speaker.mute}>
      <icon icon={bind(speaker, "volume_icon")} />
    </button>
    <slider hexpand onDragged={({ value }) => speaker.volume = value} value={bind(speaker, "volume")} />
  </box>
}

// Quick settings box which provides access to toggles and sliders for
// quickly changing transient desktop settings.
function QuickSettings(): Gtk.Widget {
  const grid = Gtk.Grid.new()
  grid.set_vexpand(true);
  grid.set_hexpand(true);
  grid.set_column_homogeneous(true);
  // grid.set_row_homogeneous(true);
  grid.attach(WirelessToggle(), 0, 0, 1, 1)
  grid.attach(BluetoothToggle(), 1, 0, 1, 1)
  grid.attach(DoNotDisturbToggle(), 2, 0, 1, 1)
  grid.attach(IdleInhibitToggle(), 3, 0, 1, 1)

  const volumeControl = VolumeControl()
  if (volumeControl !== null) {
    grid.attach(<box>{volumeControl}</box>, 0, 1, 4, 1)
  }

  grid.show_all()

  return <box className="QuickSettings" vertical>
    <centerbox className="sectionHeader">
      <label halign={Gtk.Align.START} hexpand label="Quick Settings" />
      <box />
      <box />
    </centerbox>
    <Gtk.Separator visible />
    <box className="controls">
      {grid}
    </box>
  </box>
}

function MediaPlayer(): Gtk.Widget {
  const mpris = Mpris.get_default()
  return <box className="MediaPlayers" vertical visible={bind(mpris, "players").as(arr => arr.length > 0)}>
    <centerbox className="sectionHeader">
      <label halign={Gtk.Align.START} hexpand label="Media Players" />
      <box />
      <box />
    </centerbox>
    <Gtk.Separator visible />
    {MprisPlayers(mpris)}
  </box>
}

function NotificationView() {
  const notifd = Notifd.get_default()
  const emptyNotificationMessage = [
    "Oops, all gone!",
    "Fresh out of ideas.",
    "Nada. Zilch. Zero.",
    "Well, this is awkward.",
    "The dog ate it.",
    "Insert awesome stuff here.",
    "404: List not found.",
    "Crickets... just crickets.",
    "Nothing but tumbleweeds.",
    "Space reserved for greatness.",
    "Shh... it's a secret.",
    "Gone fishing. Try later!",
    "Imaginary friends live here.",
    "Nothing to report, Captain!",
    "The list took a vacation.",
    "Nope, nada, nuh-uh.",
    "Under construction 🚧.",
    "The void stares back.",
    "Invisible list—trust us!",
    "Moved to a parallel universe.",
    "Don't observe me! 🥸",
  ]

  const notifications = bind(notifd, "notifications").as((notifications) => {
    if (notifications.length > 0) {
      return notifications
        .sort((a, b) => b.time = a.time)
        .map((n) => Notification({
          notification: n,
          onHoverLost: () => { },
          setup: () => { },
        }));
    } else {
      const message = emptyNotificationMessage[Math.floor(Math.random() * emptyNotificationMessage.length)]
      return <label className="emptyNotifications" label={message} />
    }
  })

  return <box className="Notifications" vertical>
    <centerbox className="sectionHeader">
      <label halign={Gtk.Align.START} hexpand label="Notifications" />
      <box />
      <box halign={Gtk.Align.END}>
        <button label="Clear" onClicked={() => notifd.get_notifications().forEach((n) => n.dismiss())} />
      </box>
    </centerbox>
    <Gtk.Separator visible />
    <box vertical>
      {notifications}
    </box>
  </box>
}

function SystemMenu({ GdkMonitor }: Props) {
  const menu = <window
    className="SystemMenu"
    gdkmonitor={GdkMonitor}
    exclusivity={Astal.Exclusivity.EXCLUSIVE}
    visible={false}
    anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}>
    <box vertical>
      {QuickSettings()}
      <Gtk.Separator visible />
      {MediaPlayer()}
      <Gtk.Separator visible />
      {NotificationView()}
    </box>
  </window>

  NotificationPopup({
    GdkMonitor,
    SystemMenu: menu,
  })

  return menu
}

function createSystemMenu() {
  const seat = Gdk.Display.get_default()?.get_default_seat()!

  const menu = <window
    className="SystemMenu"
    gdkmonitor={bind(Hyprland.get_default(), "focused_monitor").as((m) => FindGdkMonitor(m))}
    exclusivity={Astal.Exclusivity.EXCLUSIVE}
    visible={false}
    anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
    onButtonPressEvent={(w, event) => {
      console.log(`Button press for ${w}`)
    }}
    onDestroy={(w) => {
      console.log("Settings window closing... releasing seat...")
      HideNotificationPopup.set(false)
      seat.ungrab()
    }}
    setup={(w) => {
      HideNotificationPopup.set(true)

      w.connect("map-event", (w, evt) => {
        const gdkwin = w.get_window()!
        console.log(`Grabbing seat for window ${gdkwin}`)
        const result = seat.grab(gdkwin, Gdk.SeatCapabilities.ALL, true, null, null, null)
        if (result != Gdk.GrabStatus.SUCCESS) {
          console.log(`Failed to grab seat: ${result}`)
        }
      })
    }}
  >
    <box vertical>
      {QuickSettings()}
      <Gtk.Separator visible />
      {MediaPlayer()}
      <Gtk.Separator visible />
      {NotificationView()}
    </box>
  </window>

  menu.show_all()
  timeout(10000, () => (menu as Gtk.Window).close())
}

export const DashMenuName = "DashMenu"
export const DashMenuCloserName = "DashMenuCloser"

export function HideDashMenu() {
  App.get_window(DashMenuName)?.hide()
  App.get_window(DashMenuCloserName)?.hide()
}

export function ShowDashMenu() {
  App.get_window(DashMenuName)?.show()
  App.get_window(DashMenuCloserName)?.show()
}

export function ToggleDashMenu() {
  App.toggle_window(DashMenuName)
  App.toggle_window(DashMenuCloserName)
  return App.get_window(DashMenuName)?.visible
}

export default function DashMenu() {
  const dash = <window
    name={DashMenuName}
    namespace={DashMenuName}
    className={DashMenuName}
    exclusivity={Astal.Exclusivity.EXCLUSIVE}
    application={App}
    visible={false}
    layer={Astal.Layer.OVERLAY}
    anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
    onKeyPressEvent={(_, event) => {
      const [has_keyval, keyval] = event.get_keyval()
      if (has_keyval && keyval === Gdk.KEY_Escape) {
        HideDashMenu()
      }
    }}>
    <box vertical>
      {QuickSettings()}
      <Gtk.Separator visible />
      {MediaPlayer()}
      <Gtk.Separator visible />
      {NotificationView()}
    </box>
  </window> as Gtk.Window

  PopupCloser(DashMenuCloserName, bind(CurrentGdkMonitor), dash, () => {
    HideDashMenu()
    HideNotificationPopup.set(false)
  })

  CurrentGdkMonitor.subscribe((_) => HideDashMenu)

  return dash
}

export function DashMenuButton() {
  return <button className="DashMenuButton" onClicked={ToggleDashMenu}>
    <label className="fa-solid" label={"\uf0c9"} />
  </button>
}
