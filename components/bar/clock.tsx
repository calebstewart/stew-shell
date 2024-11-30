import { bind } from "astal/binding"
import { Variable } from "astal"
import BarItem, { ToggleForButtonEvent } from "./item"

const time = Variable("").poll(1000, "date '+%R %Z'")
const reveal = Variable(true)

export default function Clock() {
  return <BarItem
    className="Clock"
    onButtonReleaseEvent={(_, event) => ToggleForButtonEvent(event, reveal)}
    reveal={bind(reveal)}>
    <label className="fa-solid" label={"\uf017"} />
    <label label={bind(time).as(String)} />
  </BarItem>
}

