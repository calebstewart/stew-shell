import { Astal, App, Gtk, Gdk } from "astal/gtk3"

import { ActiveClient, Workspaces } from "../hyprland"
import { SettingsMenuButton } from "../settings-menu"
import PrivacyIndicators from "./privacy"
import { WiredStatus, WirelessStatus } from "./network"
import Embermug, { TemperatureUnit } from "../embermug"
import Bluetooth from "./bluetooth"
import Clock from "./clock"
import TrayItems from "./tray"
import RegisterPerMonitorWindows from "../per-monitor"
import { NotificationDrawerButton } from "../notifications"
import style from "./style/bar.scss"

export { default as BarItem } from "./item"

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
    {Clock()}
    {NotificationDrawerButton()}
    {SettingsMenuButton()}
  </box>
}

export function SetupBar(monitor: Gdk.Monitor, index: number) {
  return <window
    className={`Bar Monitor${index}`}
    gdkmonitor={monitor}
    exclusivity={Astal.Exclusivity.EXCLUSIVE}
    anchor={Anchor.TOP | Anchor.LEFT | Anchor.RIGHT}
    application={App}
    css={style}>
    <centerbox>
      {StartBlock(monitor, index)}
      {CenterBlock(monitor, index)}
      {EndBlock(monitor, index)}
    </centerbox>
  </window>
}

export default function SetupBars() {
  return RegisterPerMonitorWindows(bar_registry, SetupBar)
}
