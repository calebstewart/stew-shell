import { Variable, bind } from "astal"
import { Gtk, Astal, App } from "astal/gtk3"
import LibvirtGLib from "gi://LibvirtGLib"
import LibvirtGObject from "gi://LibvirtGObject"

import { PopupWindow } from "@components/popup"
import levenshtein from "@lib/levenshtein"

const System = LibvirtGObject.Connection.new("qemu:///system")
const Domains: Variable<Array<LibvirtGObject.Domain>> = Variable([])

// Called when the libvirt connection is opened
function connection_opened() {
  // Reset the domain list
  Domains.set([])

  // Initiate a manual refresh of domains
  System.fetch_domains_async(null, (_, res) => {
    try {
      // Complete the request
      System.fetch_domains_finish(res)

      // Now that domains are fetched, we can use get_domains to
      // initialize the domains list.
      Domains.set(System.get_domains())
    } catch (e) {
      console.error(`Could not fetch domains: ${String(e)}`)
    }
  })
}

// Called if/when the connection is closed
function connection_closed() {
  console.log("Libvirt disconnected; reconnecting...")
  open_connection()
}

// Called to re-invoke the libvirt connection. This starts
// the connection process asynchronously, and returns
// immediately.
function open_connection() {
  console.log("Opening connection")
  System.open_async(null, (_, res) => {
    try {
      if (!System.open_finish(res)) {
        console.error("Libvirt System session failed to open")
      } else {
        connection_opened()
      }
    } catch (err) {
      console.error(`Could not open libvirt system connection: ${String(err)}`)
    }
  })
  console.log("Opening in progress")
}

function domain_added(domain: LibvirtGObject.Domain) {
  Domains.set([domain, ...Domains.get()])
}

function domain_removed(domain: LibvirtGObject.Domain) {
  Domains.set(Domains.get().filter((v) => v !== domain))
}

function DomainButton({ domain }: {
  domain: LibvirtGObject.Domain,
}) {
  return <label label={domain.get_name()} />
}

function ScoreForDomain(search: string, domain: LibvirtGObject.Domain) {
  const name = domain.get_name()
  const uuid = domain.get_uuid()
  // const id = domain.get_id()
  const distance = levenshtein(search, name)

  if (search === name || search === uuid) {
    return distance * 2
  } else {
    return distance
  }
}

function VirtualMachinePopup({ }: {}) {
  const input = Variable("")
  const domains_by_distance = Variable.derive(
    [bind(input), bind(Domains)],
    (input, domains) => {
      return domains.sort((a, b) => {
        const score_a = ScoreForDomain(input, a)
        const score_b = ScoreForDomain(input, b)
        console.log(`Scoring domains ${score_a} ${score_b}`)
        return score_a - score_b
      })
    },
  )

  return <PopupWindow
    name="VirtualMachineManager"
    className="VirtualMachineManager"
    namespace="VirtualMachineManager"
    application={App}
    visible={false}
    anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.BOTTOM | Astal.WindowAnchor.LEFT}
    exclusivity={Astal.Exclusivity.NORMAL}
    keymode={Astal.Keymode.EXCLUSIVE}
    onShow={() => input.set("")}
    onDestroy={() => domains_by_distance.drop()}>
    <box vertical>
      <entry
        placeholder_text="Search..."
        text={bind(input)}
        onChanged={(e) => input.set(e.text)} />
      <Gtk.Separator />
      <box spacing={6} vertical>
        {bind(domains_by_distance).as((domains) => domains.map((domain) => (
          <DomainButton domain={domain} />
        )))}
      </box>
      <box
        halign={Gtk.Align.CENTER}
        className="not-found"
        vertical
        visible={true}>
        <icon icon="system-search-symbolic" />
        <label label="No matching VM found" />
      </box>
    </box>
  </PopupWindow>
}

export function SetupVMM() {
  // Global Libvirt initialization
  const [result, _unknown] = LibvirtGLib.init_check(null)
  if (!result) {
    console.error("Could not initialize libvirt-glib")
    return
  }

  // Register handlers for connection signals
  System.connect("connection-closed", () => connection_closed())
  System.connect("domain-added", (_, domain) => domain_added(domain))
  System.connect("domain-removed", (_, domain) => domain_removed(domain))

  // Initialize the connections
  open_connection()

  // Create the popup window for interacting with domains
  return <VirtualMachinePopup />
}
