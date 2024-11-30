import { Variable } from "astal"
import { bind } from "astal/binding"
import Network from "gi://AstalNetwork"

import BarItem, { ToggleForButtonEvent } from "./item"

const network = Network.get_default()
const reveal_wired = Variable(false)
const reveal_wireless = Variable(false)

export function WiredStatus() {
  return <BarItem
    className="WiredNetwork"
    onButtonReleaseEvent={(_, e) => ToggleForButtonEvent(e, reveal_wired, 1)}
    reveal={bind(reveal_wired)}>
    <icon icon={bind(network.wired, "icon_name").as(String)} />
    <label label={bind(network.wired, "device").as((device) => {
      const ip4 = device.ip4_config
      if (ip4 && ip4.get_addresses().length > 0) {
        return ip4.get_addresses()[0].get_address()
      } else {
        return "No address"
      }
    })} />
  </BarItem>
}

export function WirelessStatus() {
  return <BarItem
    className="WirelessNetwork"
    onButtonReleaseEvent={(_, e) => ToggleForButtonEvent(e, reveal_wireless, 1)}
    reveal={bind(reveal_wireless)}>
    <icon icon={bind(network.wifi, "icon_name").as(String)} />
    <label label={bind(network.wifi, "state").as((state) => {
      const ssid = network.wifi.ssid

      if (state == Network.DeviceState.ACTIVATED) {
        return `${ssid}`
      } else if (state == Network.DeviceState.DISCONNECTED) {
        return `Disconnected`
      } else {
        return `${ssid} (${state.toString()})`
      }
    })} />
  </BarItem>
}

