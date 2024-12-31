import { Variable } from "astal"
import { bind } from "astal/binding"
import Network from "gi://AstalNetwork"

import BarItem, { ToggleForButtonEvent } from "./item"

const network = Network.get_default()
const reveal_wired = Variable(false)
const reveal_wireless = Variable(false)

export function WiredStatus() {
  return bind(network, "wired").as((wired) => {
    if (wired === null) {
      return <box />
    } else {
      return <BarItem
        className="WiredNetwork"
        onButtonReleaseEvent={(_, e) => ToggleForButtonEvent(e, reveal_wired, 1)}
        reveal={bind(reveal_wired)}>
        <icon icon={bind(wired, "icon_name").as(String)} />
        <label label={bind(wired, "device").as((device) => {
          const ip4 = device.ip4_config
          if (ip4 && ip4.get_addresses().length > 0) {
            return ip4.get_addresses()[0].get_address()
          } else {
            return "No address"
          }
        })} />
      </BarItem>
    }
  })
}

export function WirelessStatus() {
  return bind(network, "wifi").as((wifi) => {
    if (wifi === null) {
      return <box />
    } else {
      return <BarItem
        className="WirelessNetwork"
        onButtonReleaseEvent={(_, e) => ToggleForButtonEvent(e, reveal_wireless, 1)}
        reveal={bind(reveal_wireless)}>
        <icon icon={bind(wifi, "icon_name").as(String)} />
        <label label={bind(wifi, "state").as((state) => {
          const ssid = wifi.ssid

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
  })
}

