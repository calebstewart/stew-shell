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

import ControlPanelPopover from "@components/control-panel"

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
  // All individual icons are revealed by one state variable. The reveal is automatically
  // set on-hover of the end block, and should remain open as long 
  const tray = Tray.get_default()
  const trayItems = createBinding(tray, "items")
  const [hover, setHover] = createState(false);
  const motionController = new Gtk.EventControllerMotion();
  const motionControllerIDs = [
    motionController.connect("enter", () => setHover(true)),
    motionController.connect("leave", () => setHover(false)),
  ];
  var [popoverVisible, setPopoverVisible] = createState(false);

  const reveal = createComputed([popoverVisible, hover], (popover, hover) => (popover || hover))

  const onDestroy = (button: Gtk.MenuButton) => {
    button.remove_controller(motionController);
    motionControllerIDs.forEach((id) => motionController.disconnect(id));
  };

  const onSetup = (button: Gtk.MenuButton) => {
    button.add_controller(motionController);
  };

  return <box class="EndBlock" $type="end">
    <menubutton
      visible={true}
      always_show_arrow={false}
      direction={Gtk.ArrowType.NONE}
      onDestroy={onDestroy}
      $={onSetup}
    >
      <box class="IconContainer" orientation={Gtk.Orientation.HORIZONTAL}>
        <box>
          <For each={trayItems}>
            {(item) => <TrayItem reveal={reveal} item={item} />}
          </For>
        </box>
        <VideoRecordingIndicator reveal={reveal} />
        <ListeningIndicator reveal={reveal} />
        <WiredStatus reveal={reveal} />
        <WirelessStatus reveal={reveal} />
        <Bluetooth reveal={reveal} />
        <Battery reveal={reveal} />
        <Clock reveal={reveal} />
      </box>
      <ControlPanelPopover monitor={monitor} setVisible={setPopoverVisible} />
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
