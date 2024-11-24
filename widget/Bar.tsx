import { App, Astal, Gtk, Gdk } from "astal/gtk3"
import { Variable, bind } from "astal"
import Hyprland from "gi://AstalHyprland"


const localTime = Variable("").poll(1000, "date '+%R %Z'")
const hyprland = Hyprland.get_default()

function Workspaces(monitor: Hyprland.Monitor, monitorIndex: number) {
  const workspaceExists = (name: string) => bind(hyprland, "workspaces").as(
    (workspaces) => workspaces.some((ws) => ws.get_name() == name)
  );

  // Create a workspace button for each potential workspace on this monitor.
  // We assume that workspaces are named like "1" through "9" for monitorIndex == 0,
  // and "51" through "59" for monitorIndex == 5. This is how splitworkspaces plugin
  // works, so it's a pretty solid bet.
  const buttons = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
    const name = (monitorIndex * 10 + i).toString(); // (0,7) => 7, (5,3) => 53, etc.

    // Create a revealer which will animate the creation/deletion of workspaces on this monitor
    return <revealer
      revealChild={workspaceExists(name)}
      transitionType={Gtk.RevealerTransitionType.SLIDE_RIGHT} >
      <button className={bind(monitor, "active_workspace").as((ws) => {
        return ws.name == name ? "activeWorkspaceButton" : "inactiveWorkspaceButton"
      })} label={i.toString()} />
    </revealer>
  });

  return <box className="workspaces">
    {buttons}
  </box>;
}

function StartBlock(monitor: Hyprland.Monitor, monitorIndex: number) {
  return <box
    halign={Gtk.Align.START}>
    {CurrentClientTitle(monitor, monitorIndex)}
  </box>
}

function CurrentClientTitle(monitor: Hyprland.Monitor, monitorIndex: number) {
  // Bind to changes in focused monitor, workspace, client or changes in the list of clients.
  // This allows us to maintain the correct window title label as hyprland state changes.
  // We only really care when the active client or workspace changes 
  const clientTitle = Variable.derive(
    [bind(hyprland, "focused_client")],
    (focusedClient) => {
      if (focusedClient === null) {
        if (hyprland.get_focused_monitor().get_serial() == monitor.get_serial()) {
          // No client is focused, and we are 
          return ""
        } else {
          return monitor.get_active_workspace().get_last_client().get_title();
        }
      } else if (focusedClient.get_monitor().get_serial() != monitor.get_serial()) {
        return monitor.get_active_workspace().get_last_client().get_title();
      } else {
        return focusedClient.get_title();
      }
    }
  )

  return <label label={bind(clientTitle)} />
}

function CenterBlock(monitor: Hyprland.Monitor, monitorIndex: number) {
  return <box
    halign={Gtk.Align.CENTER}>
    {Workspaces(monitor, monitorIndex)}
  </box>
}

function EndBlock(monitor: Hyprland.Monitor, monitorIndex: number) {
  return <box
    halign={Gtk.Align.END}>
    <label label={bind(localTime)} />
  </box>
}

export default function Bar(gdkmonitor: Gdk.Monitor, monitorIndex: number) {
  // There's no reliable way to map a GDK monitor to a hyprland monitor except their geometry
  // from what I can find. So, we query the GDK monitor geometry
  const monitorGeometry = gdkmonitor.get_geometry()

  // Then, we get all active monitors, and find the one that matches the XY coordinates of
  // our GDK monitor geometry. We could also check width/height, but it's unlikely that
  // multiple monitors would be sharing the same XY coordinates.
  const monitor = hyprland.get_monitors().find((m) => m.get_x() == monitorGeometry.x && m.get_y() == monitorGeometry.y)
  if (monitor === undefined) {
    return <label label="Unknown or invalid GDK Monitor" />
  }

  return <window
    className="Bar"
    gdkmonitor={gdkmonitor}
    exclusivity={Astal.Exclusivity.EXCLUSIVE}
    anchor={Astal.WindowAnchor.TOP
      | Astal.WindowAnchor.LEFT
      | Astal.WindowAnchor.RIGHT}
    application={App}>
    <centerbox>
      {StartBlock(monitor, monitorIndex)}
      {CenterBlock(monitor, monitorIndex)}
      {EndBlock(monitor, monitorIndex)}
    </centerbox>
  </window>
}
