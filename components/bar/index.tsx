import app from "ags/gtk4/app"
import { For, createBinding } from "ags"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { Accessor, createComputed, onCleanup, createState } from "ags"
import Tray from "gi://AstalTray"
import AstalHyprland from "gi://AstalHyprland"

import { Workspaces } from "./workspaces"
import { ActiveWorkspace } from "./active-workspace"
// import { SettingsMenuButton } from "@components/settings-menu"
// import Embermug, { TemperatureUnit } from "@components/embermug"
// import RegisterPerMonitorWindows from "@components/per-monitor"
// import { NotificationDrawerButton } from "@components/notifications"

// import PrivacyIndicators from "./privacy"
import { ListeningIndicator, VideoRecordingIndicator } from "./privacy"
import { WiredStatus, WirelessStatus } from "./network"
import Bluetooth from "./bluetooth"
import Clock from "./clock"
import TrayItem from "./tray"
// import TrayItems from "./tray"
import Battery from "./battery"

import { ControlPanelPopover, ControlPanelRevealed } from "@components/control-panel"

// export { default as BarItem } from "./item"
// export { default as PrivacyIndicators } from "./privacy"
// export { WiredStatus, WirelessStatus } from "./network"
// export { default as Bluetooth } from "./bluetooth"
// export { default as Clock } from "./clock"
// export { default as TrayItems } from "./tray"

const Anchor = Astal.WindowAnchor

function StartBlock({ gdkmonitor, monitor, index }: { gdkmonitor: Gdk.Monitor, monitor: Accessor<AstalHyprland.Monitor>, index: Accessor<number> }) {
  return <box class="StartBlock" $type="start">
    <ActiveWorkspace gdkmonitor={gdkmonitor} monitor={monitor} index={index} />
  </box>
}

function CenterBlock({ gdkmonitor, monitor, index }: { gdkmonitor: Gdk.Monitor, monitor: Accessor<AstalHyprland.Monitor>, index: Accessor<number> }) {
  return <box class="CenterBlock" $type="center">
    <Workspaces gdkmonitor={gdkmonitor} monitor={monitor} index={index} />
  </box>
}

function EndBlock({ gdkmonitor, monitor, index }: { gdkmonitor: Gdk.Monitor, monitor: Accessor<AstalHyprland.Monitor>, index: Accessor<number> }) {
  const tray = Tray.get_default()
  const trayItems = createBinding(tray, "items")

  return <box class="end" $type="end">
    <box class="application-tray">
      <For each={trayItems}>
        {(item) => <TrayItem item={item} />}
      </For>
    </box>
    <menubutton
      visible={true}
      always_show_arrow={false}
      direction={Gtk.ArrowType.NONE}
      class="control-panel flat"
    >
      <box class="system-tray" orientation={Gtk.Orientation.HORIZONTAL}>
        <VideoRecordingIndicator reveal={ControlPanelRevealed} />
        <ListeningIndicator reveal={ControlPanelRevealed} />
        <WiredStatus reveal={ControlPanelRevealed} />
        <WirelessStatus reveal={ControlPanelRevealed} />
        <Bluetooth reveal={ControlPanelRevealed} />
        <Battery reveal={ControlPanelRevealed} />
        <Clock reveal={ControlPanelRevealed} />
      </box>
      <ControlPanelPopover monitor={monitor} />
    </menubutton >
  </box >
}

export function Bar({ gdkmonitor, index }: { gdkmonitor: Gdk.Monitor, index: Accessor<number> }) {
  const name = createComputed((get) => `Bar${get(index)}`);
  const clazz = createComputed((get) => `Bar Monitor${get(index)}`);
  const hyprland = AstalHyprland.get_default()
  const monitors = createBinding(hyprland, "monitors")
  const monitor = monitors((monitors) => monitors.find((monitor) => gdkmonitor.description.includes(monitor.description))!)

  return <window
    name={name}
    class={clazz}
    gdkmonitor={gdkmonitor}
    exclusivity={Astal.Exclusivity.EXCLUSIVE}
    anchor={Anchor.TOP | Anchor.LEFT | Anchor.RIGHT}
    $={(self) => onCleanup(() => self.destroy())}
    visible>
    <centerbox class="Bar" orientation={Gtk.Orientation.HORIZONTAL}>
      <StartBlock gdkmonitor={gdkmonitor} monitor={monitor} index={index} />
      <CenterBlock gdkmonitor={gdkmonitor} monitor={monitor} index={index} />
      <EndBlock gdkmonitor={gdkmonitor} monitor={monitor} index={index} />
    </centerbox>
  </window>
}
