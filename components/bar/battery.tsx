import { createBinding, Accessor } from "ags"
import { Gtk } from "ags/gtk4"
import AstalBattery from "gi://AstalBattery"

export default function Battery({ reveal }: {
  reveal: Accessor<boolean>,
}) {
  const battery = AstalBattery.get_default()
  const icon = createBinding(battery, "icon_name")
  const percentage = createBinding(battery, "percentage")

  return (
    <box visible={createBinding(battery, "is_present")}>
      <image class="icon" icon_name={icon} />
      <revealer
        transition_type={Gtk.RevealerTransitionType.SLIDE_LEFT}
        reveal_child={reveal}
      >
        <label label={percentage((v: number) => `${Math.round(v * 100)}%`)} />
      </revealer>
    </box>
  )
}
