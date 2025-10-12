import { Gtk } from "ags/gtk4"
import { Accessor, For, With, createBinding, createState, createComputed } from "ags"
import { createPoll } from "ags/time"

import GLib from "gi://GLib"
import Gio from "gi://Gio"
import GObject from "gi://GObject"
import AstalBattery from "gi://AstalBattery"
import AstalNetwork from "gi://AstalNetwork"
import AstalBluetooth from "gi://AstalBluetooth"
import AstalPowerProfiles from "gi://AstalPowerProfiles"
import AstalNotifd from "gi://AstalNotifd"
import AstalHyprland from "gi://AstalHyprland"

import { Notification } from "./notifd"
import { BatteryStateToLabel } from "@components/bar/battery"
import PopoverRegistry from "@components/popoverregistry"

import ScreenSaver from "@lib/org/freedesktop/ScreenSaver"
import { Manager as LoginManager, get_active_session } from "@lib/org/freedesktop/login1"

export const ControlPanelRegistry = new PopoverRegistry()

function SystemControls({ }: {}) {
  const battery = AstalBattery.get_default()
  const batteryIcon = createBinding(battery, "icon_name")
  const batteryPercentage = createBinding(battery, "percentage")
  const batteryState = createBinding(battery, "state")
  const batteryPresent = createBinding(battery, "is_present")
  const batteryTooltip = createComputed([batteryPercentage, batteryState], (percentage, state) => (
    `${BatteryStateToLabel(state)} (${Math.round(percentage * 100)}%)`
  ))
  const datetime = createPoll(GLib.DateTime.new_now_local(), 1000, () => (
    GLib.DateTime.new_now_local()
  ))
  const date = datetime((v: GLib.DateTime) => v.format("%A, %d %b %Y")!)
  const network = AstalNetwork.get_default()
  const bluetooth = AstalBluetooth.get_default()
  const powerProfiles = AstalPowerProfiles.get_default()
  const [revealPower, setRevealPower] = createState(false)
  const session = get_active_session()
  var inhibitCookie: number | null = null

  const inhibitToggle = (self: Gtk.ToggleButton) => {
    if (self.active && inhibitCookie === null) {
      return
    }

    if (!self.active) {
      inhibitCookie = ScreenSaver.InhibitSync("stew-shell", "User requested")
    } else {
      ScreenSaver.UnInhibitSync(inhibitCookie)
    }
  }

  const setupBluetooth = (self: Gtk.ToggleButton) => {
    // Bidirectional binding of bluetooth adapter power
    self.bind_property("active", bluetooth.adapter, "powered", GObject.BindingFlags.BIDIRECTIONAL)
  }

  const setupWifi = (self: Gtk.ToggleButton, wifi: AstalNetwork.Wifi) => {
    // Bidirectional binding with wifi status
    self.bind_property("active", network.wifi, "enabled", GObject.BindingFlags.BIDIRECTIONAL)
  }

  return <box class="system-controls" orientation={Gtk.Orientation.VERTICAL}>
    <centerbox class="toolbar">
      <box $type="start">
        <label class="header" label={date} />
      </box>
      <box $type="center" />
      <box $type="end">
        <button icon_name={batteryIcon} tooltip_text={batteryTooltip} visible={batteryPresent} />
        <button icon_name="system-lock-screen-symbolic" tooltip_text="Lock Screen" onClicked={() => LoginManager.LockSessionSync(session.Id)} />
        <button icon_name="system-reboot-symbolic" tooltip_text="Reboot" onClicked={() => LoginManager.RebootSync(true)} />
        <button icon_name="system-shutdown-symbolic" tooltip_text="Shutdown" onClicked={() => LoginManager.PowerOffSync(true)} />
      </box>
    </centerbox >
    <revealer reveal_child={revealPower} transition_type={Gtk.RevealerTransitionType.SLIDE_DOWN}>
      <box orientation={Gtk.Orientation.VERTICAL}>
        <Gtk.Separator visible={true} />
        {powerProfiles.get_profiles().map((profile) => {
          return <button label={profile.profile} />
        })}
      </box>
    </revealer>
    <Gtk.Separator visible={true} />
    <Gtk.FlowBox
      homogeneous={true}
      max_children_per_line={4}
      valign={Gtk.Align.START}
      selection_mode={Gtk.SelectionMode.NONE}>
      <With value={createBinding(network, "wifi")}>
        {(wifi: AstalNetwork.Wifi) => {
          if (wifi === null) {
            return null;
          }

          return <Gtk.FlowBoxChild>
            <togglebutton
              hexpand={true}
              vexpand={true}
              label="Wi-Fi"
              active={network.wifi.enabled}
              $={(self) => setupWifi(self, wifi)} />
          </Gtk.FlowBoxChild>
        }}
      </With>
      <Gtk.FlowBoxChild>
        <togglebutton
          hexpand={true}
          vexpand={true}
          label="Bluetooth"
          active={bluetooth.adapter.powered}
          $={setupBluetooth} />
      </Gtk.FlowBoxChild>
      <Gtk.FlowBoxChild>
        <togglebutton hexpand={true} vexpand={true} label="Do Not Disturb" />
      </Gtk.FlowBoxChild>
      <Gtk.FlowBoxChild>
        <togglebutton hexpand={true} vexpand={true} label="Auto-Lock" active={true} onNotifyActive={inhibitToggle} />
      </Gtk.FlowBoxChild>
    </Gtk.FlowBox>
  </box >
}

export default function ControlPanelPopover({ monitor, setVisible }: {
  monitor: Accessor<AstalHyprland.Monitor>,
  setVisible: (v: boolean) => void,
}) {
  const notifd = AstalNotifd.get_default()
  const notifications = createBinding(notifd, "notifications")
  const hasNotifications = notifications((notifications) => notifications.length > 0)
  const setup = (self: Gtk.Popover) => ControlPanelRegistry.add(monitor.get(), self)
  const destroy = (self: Gtk.Popover) => ControlPanelRegistry.remove(self)
  const show = (_: Gtk.Popover) => setVisible(true)
  const hide = (_: Gtk.Popover) => setVisible(false)

  return <popover class="control-panel" $={setup} onShow={show} onHide={hide} onDestroy={destroy}>
    <box orientation={Gtk.Orientation.VERTICAL}>
      <SystemControls />
      <scrolledwindow propagate_natural_width={true} propagate_natural_height={true} visible={hasNotifications}>
        <box orientation={Gtk.Orientation.VERTICAL}>
          <For each={notifications}>
            {(notification) => (
              <Notification notification={notification} />
            )}
          </For>
        </box>
      </scrolledwindow>
    </box>
  </popover>
}
