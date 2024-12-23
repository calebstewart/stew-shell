import { Variable, bind } from "astal"
import Battery from "gi://AstalBattery"

import BarItem, { ToggleForButtonEvent } from "./item"

const battery = Battery.get_default()
const reveal = Variable(false)

export default function BatteryStatus() {
  return <BarItem
    className="Battery"
    onButtonReleaseEvent={(_, e) => ToggleForButtonEvent(e, reveal, 1)}>
    <icon icon={bind(battery, "icon_name").as(String)} />
    <label label={bind(battery, "percentage").as((p) => `${p * 100}%`)} />
  </BarItem>
}
