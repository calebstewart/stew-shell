import { Accessor, createBinding, createComputed, With } from "ags"
import { Gtk } from "ags/gtk4"
import Network from "gi://AstalNetwork"
import NM from "gi://NM?version=1.0"

const network = Network.get_default()

export function WiredStatus({ reveal }: {
  reveal: Accessor<boolean>,
}) {

  return <With value={createBinding(network, "wired")}>
    {(wired: Network.Wired) => {
      if (wired === null) {
        return null
      }

      const iconName = createBinding(wired, "icon_name")

      return <box>
        <With value={createBinding(wired, "device")}>
          {(device: NM.DeviceEthernet) => {
            if (device === null) {
              return null
            }

            const ip4_config = createBinding(wired.device, "ip4_config")
            const ip4_address = ip4_config((cfg: NM.IPConfig) => {
              if (cfg && cfg.addresses && cfg.addresses.length > 0) {
                return cfg.addresses[0].address
              } else {
                return "No address"
              }
            })

            return <box>
              <image class="icon" icon_name={iconName} />
              <revealer
                reveal_child={reveal}
                transition_type={Gtk.RevealerTransitionType.SLIDE_LEFT}
              >
                <label label={ip4_address} />
              </revealer>
            </box>
          }}
        </With>
      </box>
    }}
  </With>
}

export function WirelessStatus({ reveal }: {
  reveal: Accessor<boolean>,
}) {
  return <With value={createBinding(network, "wifi")}>
    {(wifi: Network.Wifi) => {
      if (wifi === null) {
        return null
      }

      const state = createBinding(wifi, "state")
      const ssid = createBinding(wifi, "ssid")
      const label = createComputed([state, ssid], (state, ssid) => {
        if (state == Network.DeviceState.ACTIVATED) {
          return ssid
        } else if (state == Network.DeviceState.DISCONNECTED) {
          return "Disconnected"
        } else {
          return `${ssid} (${state.toString()})`
        }
      })

      return (<box visible={wifi !== null}>
        <image class="icon" icon_name={createBinding(wifi, "icon_name")} />
        <revealer
          reveal_child={reveal}
          transition_type={Gtk.RevealerTransitionType.SLIDE_LEFT}
        >
          <label label={label} />
        </revealer>
      </box>)
    }}
  </With>
}

