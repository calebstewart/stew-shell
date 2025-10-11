import { Accessor, createBinding } from "ags"
import { Gtk } from "ags/gtk4"
import Tray from "gi://AstalTray"

export default function TrayItem({ reveal, item, setVisible }: {
  reveal: Accessor<boolean>,
  item: Tray.TrayItem,
  setVisible: (v: boolean) => void,
}) {
  const icon = createBinding(item, "gicon")
  const title = createBinding(item, "tooltip_text")

  const setup = (self: Gtk.MenuButton) => {
    self.insert_action_group("dbusmenu", item.action_group)

    self.popover.connect("show", () => setVisible(true))
    self.popover.connect("hide", () => setVisible(false))
  }

  return <menubutton class="flat" menu_model={createBinding(item, "menu_model")} $={setup}>
    <box>
      <image class="icon" gicon={icon} />
      <revealer reveal_child={reveal} transition_type={Gtk.RevealerTransitionType.SLIDE_LEFT}>
        <label label={title} />
      </revealer>
    </box>
  </menubutton>
}
