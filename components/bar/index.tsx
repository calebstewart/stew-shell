import { Astal, App, Gtk, Gdk } from "astal/gtk3"

import { ActiveClient, Workspaces } from "@components/hyprland"
import { SettingsMenuButton } from "@components/settings-menu"
import Embermug, { TemperatureUnit } from "@components/embermug"
import RegisterPerMonitorWindows from "@components/per-monitor"
import { NotificationDrawerButton } from "@components/notifications"

import PrivacyIndicators from "./privacy"
import { WiredStatus, WirelessStatus } from "./network"
import Bluetooth from "./bluetooth"
import Clock from "./clock"
import TrayItems from "./tray"
import BatteryStatus from "./battery"
import style from "./style/bar.scss"

export { default as BarItem } from "./item"
export { default as PrivacyIndicators } from "./privacy"
export { WiredStatus, WirelessStatus } from "./network"
export { default as Bluetooth } from "./bluetooth"
export { default as Clock } from "./clock"
export { default as TrayItems } from "./tray"

const Anchor = Astal.WindowAnchor
const bar_registry = new Map<Gdk.Monitor, Gtk.Widget>()

function StartBlock(_monitor: Gdk.Monitor, index: number) {
  return <box className="StartBlock" halign={Gtk.Align.START}>
    {ActiveClient(index)}
  </box>
}

function CenterBlock(_monitor: Gdk.Monitor, index: number) {
  return <box className="CenterBlock" halign={Gtk.Align.CENTER}>
    {Workspaces(index)}
  </box>
}

function EndBlock(_monitor: Gdk.Monitor, _index: number) {
  return <box className="EndBlock" halign={Gtk.Align.END}>
    {TrayItems()}
    {Embermug(TemperatureUnit.FAHRENHEIT)}
    {Bluetooth()}
    {WiredStatus()}
    {WirelessStatus()}
    {PrivacyIndicators()}
    {BatteryStatus()}
    {Clock()}
    {NotificationDrawerButton()}
    {SettingsMenuButton()}
  </box>
}

export function SetupBar(monitor: Gdk.Monitor, index: number) {
  return <window
    name={`Bar${index}`}
    className={`Bar Monitor${index}`}
    gdkmonitor={monitor}
    exclusivity={Astal.Exclusivity.EXCLUSIVE}
    anchor={Anchor.TOP | Anchor.LEFT | Anchor.RIGHT}
    application={App}
    css={style}>
    <centerbox className="Bar">
      {StartBlock(monitor, index)}
      {CenterBlock(monitor, index)}
      {EndBlock(monitor, index)}
    </centerbox>
  </window>
}

export default function SetupBars() {
  return RegisterPerMonitorWindows(bar_registry, SetupBar)
}
