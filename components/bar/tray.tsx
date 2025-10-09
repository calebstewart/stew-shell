import { Accessor, createBinding } from "ags"
import { Gtk } from "ags/gtk4"
import Tray from "gi://AstalTray"

export default function TrayItem({ reveal, item }: {
  reveal: Accessor<boolean>,
  item: Tray.TrayItem,
}) {
  const icon = createBinding(item, "gicon")
  const title = createBinding(item, "tooltip_text")


  return <box>
    <image class="icon" gicon={icon} />
    <revealer reveal_child={reveal} transition_type={Gtk.RevealerTransitionType.SLIDE_LEFT}>
      <label label={title} />
    </revealer>
  </box>
}
