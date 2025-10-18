import { createBinding, Accessor } from "ags"
import { Gtk } from "ags/gtk4"
import AstalBattery from "gi://AstalBattery"


export function BatteryStateToLabel(state: AstalBattery.State): string {
  switch (state) {
    case AstalBattery.State.EMPTY:
      return "Empty"
    case AstalBattery.State.UNKNOWN:
      return "Unknown"
    case AstalBattery.State.CHARGING:
      return "Charging"
    case AstalBattery.State.DISCHARGING:
      return "Discharging"
    case AstalBattery.State.FULLY_CHARGED:
      return "Fully Charged"
    case AstalBattery.State.PENDING_CHARGE:
      return "Pending Charge"
    case AstalBattery.State.PENDING_DISCHARGE:
      return "Pending Discharge"
    default:
      return "Unknown"
  }
}

export default function Battery({ reveal }: {
  reveal: Accessor<boolean>,
}) {
  const battery = AstalBattery.get_default()
  const icon = createBinding(battery, "icon_name")
  const percentage = createBinding(battery, "percentage")
  const state = createBinding(battery, "state")
  const tooltip = state((state) => BatteryStateToLabel(state))

  return (
    <box class="tray-item" visible={createBinding(battery, "is_present")} tooltip_text={tooltip}>
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
