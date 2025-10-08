import { Gtk } from "ags/gtk4"
import { createBinding, createState } from "ags"
import { createPoll } from "ags/time"

import GLib from "gi://GLib"
import AstalBattery from "gi://AstalBattery"
import AstalNetwork from "gi://AstalNetwork"
import AstalBluetooth from "gi://AstalBluetooth"
import AstalPowerProfiles from "gi://AstalPowerProfiles"

export default function ControlPanel() {
  const battery = AstalBattery.get_default()
  const batteryIcon = createBinding(battery, "icon_name")
  const datetime = createPoll(GLib.DateTime.new_now_local(), 1000, () => (
    GLib.DateTime.new_now_local()
  ))
  const date = datetime((v: GLib.DateTime) => v.format("%A, %d %b")!)
  const network = AstalNetwork.get_default()
  const bluetooth = AstalBluetooth.get_default()
  const powerProfiles = AstalPowerProfiles.get_default()
  const [revealPower, setRevealPower] = createState(false)


  return <box class="control-panel" orientation={Gtk.Orientation.VERTICAL}>
    <centerbox class="system-controls">
      <box hexpand={true} $type="start">
        <label label={date} />
      </box>
      <box hexpand={true} $type="center" />
      <box hexpand={true} $type="end">
        <button icon_name={batteryIcon} />
        <button icon_name="system-lock-screen-symbolic" />
        <button icon_name="system-reboot-symbolic" />
        <button icon_name="system-shutdown-symbolic" />
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
