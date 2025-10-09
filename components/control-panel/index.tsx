import { Gtk } from "ags/gtk4"
import { For, createBinding, createState, createComputed } from "ags"
import { createPoll } from "ags/time"

import GLib from "gi://GLib"
import AstalBattery from "gi://AstalBattery"
import AstalNetwork from "gi://AstalNetwork"
import AstalBluetooth from "gi://AstalBluetooth"
import AstalPowerProfiles from "gi://AstalPowerProfiles"
import AstalNotifd from "gi://AstalNotifd"

import { Notification } from "./notifd"
import { BatteryStateToLabel } from "@components/bar/battery"

function SystemControls({ }: {}) {
  const battery = AstalBattery.get_default()
  const batteryIcon = createBinding(battery, "icon_name")
  const batteryPercentage = createBinding(battery, "percentage")
  const batteryState = createBinding(battery, "state")
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


  return <box class="system-controls" orientation={Gtk.Orientation.VERTICAL}>
    <centerbox class="toolbar">
      <box $type="start">
        <label class="header" label={date} />
      </box>
      <box $type="center" />
      <box $type="end">
        <button icon_name={batteryIcon} tooltip_text={batteryTooltip} />
        <button icon_name="system-lock-screen-symbolic" tooltip_text="Lock Screen" />
        <button icon_name="system-reboot-symbolic" tooltip_text="Reboot" />
        <button icon_name="system-shutdown-symbolic" tooltip_text="Shutdown" />
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
      <Gtk.FlowBoxChild>
        <togglebutton
          hexpand={true}
          vexpand={true}
          label="Wi-Fi"
          active={createBinding(network.wifi, "enabled")}
          onToggled={(b) => { network.wifi.enabled = b.active }} />
      </Gtk.FlowBoxChild>
      <Gtk.FlowBoxChild>
        <togglebutton
          hexpand={true}
          vexpand={true}
          label="Bluetooth"
          active={createBinding(bluetooth.adapter, "powered")}
          onToggled={(b) => { bluetooth.adapter.powered = b.active }} />
      </Gtk.FlowBoxChild>
      <Gtk.FlowBoxChild>
        <togglebutton hexpand={true} vexpand={true} label="Do Not Disturb" />
      </Gtk.FlowBoxChild>
      <Gtk.FlowBoxChild>
        <togglebutton hexpand={true} vexpand={true} label="Auto-Lock" />
      </Gtk.FlowBoxChild>
    </Gtk.FlowBox>
  </box >
}

export default function ControlPanel() {
  const notifd = AstalNotifd.get_default()
  const notifications = createBinding(notifd, "notifications")
  const hasNotifications = notifications((notifications) => notifications.length > 0)

  return <box orientation={Gtk.Orientation.VERTICAL}>
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
}
