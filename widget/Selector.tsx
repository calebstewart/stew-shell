import Apps from "gi://AstalApps"

type ItemProps = {
  iconName: string
  name: string
  description: string
  action(self: any): void
}

function Item(props: ItemProps) {
  return <button
    className="ItemButton"
    onClicked={() => { props.action(props) }} />
}
