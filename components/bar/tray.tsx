import { Accessor, createBinding, createState } from "ags"
import { Gtk } from "ags/gtk4"
import Tray from "gi://AstalTray"

export default function TrayItem({ item }: {
  item: Tray.TrayItem,
}) {
  const icon = createBinding(item, "gicon")
  const title = createBinding(item, "tooltip_text")
  const [visible, setVisible] = createState(false)

  const setup = (self: Gtk.MenuButton) => {
    self.insert_action_group("dbusmenu", item.action_group)

    self.popover.connect("show", () => setVisible(true))
    self.popover.connect("hide", () => setVisible(false))
  }

  return <menubutton class="tray-item flat" menu_model={createBinding(item, "menu_model")} $={setup}>
    <box>
      <image class="icon" gicon={icon} />
      <revealer reveal_child={visible} transition_type={Gtk.RevealerTransitionType.SLIDE_LEFT}>
        <label label={title} />
      </revealer>
    </box>
  </menubutton>
}
