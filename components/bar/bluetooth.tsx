import { createBinding, createState, Accessor } from "ags"
import { Gtk } from "ags/gtk4"
import Bluetooth from "gi://AstalBluetooth"

export default function BluetoothStatus({ reveal }: {
  reveal: Accessor<boolean>,
}) {
  const bluetooth = Bluetooth.get_default();
  const is_powered = createBinding(bluetooth, "is_powered");
  const icon = is_powered((powered) => powered ? "bluetooth-active" : "bluetooth-disabled");
  const devices = createBinding(bluetooth, "devices");

  const [details, setDetails] = createState("Unknown");

  var deviceSubscriptionUnsubs = new Array<() => void>();

  const updateDetails = (devices: Array<Bluetooth.Device>) => {
    const connectedDevices = devices.filter((d) => d.connected);

    if (connectedDevices.length == 1) {
      setDetails(connectedDevices[0].name)
    } else if (connectedDevices.length == 0) {
      setDetails("Not Connected")
    } else {
      setDetails(`${connectedDevices.length} Devices`)
    }
  };

  const devicesUnsub = devices.subscribe(() => {
    deviceSubscriptionUnsubs.forEach((unsub) => unsub())
    deviceSubscriptionUnsubs = [];

    updateDetails(bluetooth.devices)

    bluetooth.devices.forEach((device) => {
      deviceSubscriptionUnsubs.push(
        createBinding(device, "connected").subscribe(() => updateDetails(bluetooth.devices))
      )
    });
  })

  updateDetails(bluetooth.devices)

  return <box class="tray-item" onDestroy={() => devicesUnsub()}>
    <image class="icon" icon_name={icon} />
    <revealer
      reveal_child={reveal}
      transition_type={Gtk.RevealerTransitionType.SLIDE_LEFT}
    >
      <label label={details} />
    </revealer>
  </box>
}
