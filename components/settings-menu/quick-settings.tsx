import { bind } from "astal"
import { Gtk, Widget } from "astal/gtk3"
import Binding from "astal/binding"
import Bluetooth from "gi://AstalBluetooth"
import Network from "gi://AstalNetwork"

import { ToggleButton, FlowBox, FlowBoxChild } from "../builtin"
import { DoNotDisturb } from "../notifications"

export interface QuickToggleProps {
  onToggled?: (self: Gtk.ToggleButton) => void
  children?: JSX.Element | JSX.Element[] | undefined
  active?: boolean | Binding<boolean> | undefined
  label?: string | Binding<string> | undefined
}

export function QuickToggle(buttonprops: QuickToggleProps) {
  var { children, label, ...props } = buttonprops

  if (label !== undefined && children === undefined) {
    children = <label justify={Gtk.Justification.CENTER} wrap label={label} />
  }

  return <FlowBoxChild>
    <ToggleButton {...props} className="QuickSettingsToggle" expand>
      {children}
    </ToggleButton>
  </FlowBoxChild>
}

function DoNotDisturbToggle({ }: {}) {
  return <QuickToggle label="Do Not Disturb" onToggled={(b) => DoNotDisturb.set(b.active)} />
}

function IdleInhibitToggle({ }: {}) {
  return <QuickToggle label="Auto-Lock" onToggled={(b) => {
    const window = b.get_toplevel() as Widget.Window
    if (window) {
      window.inhibit = !window.inhibit
    }
  }} />
}

function WifiToggle({ }: {}) {
  const network = Network.get_default()

  return <QuickToggle label="Wi-Fi" active={bind(network.wifi, "enabled")} onToggled={(b) => {
    network.wifi.enabled = b.active
  }} />
}

function BluetoothToggle({ }: {}) {
  const bluetooth = Bluetooth.get_default()

  return <QuickToggle label="Bluetooth" active={bind(bluetooth.adapter, "powered")} onToggled={(b) => {
    bluetooth.adapter.powered = b.active
  }} />
}

export interface QuickSettingsProps {
}

export default function QuickSettings({ }: QuickSettingsProps) {
  return <box className="QuickSettings" vertical css="min-width: 400px">
    <centerbox className="SettingsMenuHeader" >
      <label halign={Gtk.Align.START} hexpand label="Quick Settings" />
      <box />
      <box />
    </centerbox>
    <Gtk.Separator visible />
    <FlowBox
      className="QuickSettingsControls"
      homogeneous={true}
      max_children_per_line={4}
      valign={Gtk.Align.START}
      selection_mode={Gtk.SelectionMode.NONE}>
      <WifiToggle />
      <BluetoothToggle />
      <DoNotDisturbToggle />
      <IdleInhibitToggle />
    </FlowBox>
  </box >
}
