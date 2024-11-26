import { Variable } from "astal"
import { bind } from "astal/binding"
import TrayIcon, { RevealValue } from "./TrayIcon"
import Network from "gi://AstalNetwork"

const network = Network.get_default()
const lockWired = Variable(false)
const lockWireless = Variable(false)

export function WiredTrayIcon() {
  return TrayIcon({
    className: "WiredNetwork",
    icon: <icon icon={bind(network.wired, "icon_name").as(String)} />,
    label: bind(network.wired, "device").as((device) => {
      const ip4 = device.ip4_config
      if (ip4 && ip4.get_addresses().length > 0) {
        return ip4.get_addresses()[0].get_address()
      } else {
        return "No address"
      }
    }),
    onButtonReleased: (_widget, event) => lockWired.set(RevealValue(event, lockWired.get())),
    lockReveal: bind(lockWired),
  })
}

export function WirelessTrayIcon() {
  const label = bind(network.wifi, "state").as((state) => {
    const ssid = network.wifi.ssid
    const conn = network.wifi.active_connection

    if (state == Network.DeviceState.ACTIVATED) {
      return `${ssid}`
    } else if (state == Network.DeviceState.DISCONNECTED) {
      return `Disconnected`
    } else {
      return `${ssid} (${state.toString()})`
    }
  })

  return TrayIcon({
    className: "WirelessNetwork",
    icon: <icon icon={bind(network.wifi, "icon_name").as(String)} />,
    label: label,
    onButtonReleased: (_widget, event) => lockWireless.set(RevealValue(event, lockWireless.get())),
    lockReveal: bind(lockWireless),
  })
}

