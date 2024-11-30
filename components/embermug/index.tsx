import { bind } from "astal"

import BarItem from "../bar/item"
import EmbermugClient, { ToFahrenheit, ToCelsius, Mug, MugState, MugStateToString } from "./client"

export * from "./client"
export const Embermug = EmbermugClient.get_default()

export enum TemperatureUnit {
  FAHRENHEIT,
  CELSIUS,
}

function mugLabel(mug: Mug, units: TemperatureUnit) {
  if (!mug.Connected) {
    return "Disconnected"
  }

  const convert = units === TemperatureUnit.FAHRENHEIT ? ToFahrenheit : ToCelsius
  const current = Math.round(convert(mug.Current)).toString()
  const target = Math.round(convert(mug.Target)).toString()
  const stateName = MugStateToString(mug.State)

  switch (mug.State) {
    case MugState.COOLING:
    case MugState.HEATING:
      return `${stateName} (${current}F/${target}F)`
    case MugState.STABLE:
      return `${stateName} (${current}F)`
    default:
      return stateName
  }
}

export default function EmbermugItem(units: TemperatureUnit) {
  return <BarItem
    className="EmberMug"
    reveal={bind(Embermug).as((mug) => mug.Connected && mug.HasLiquid)} >
    <label
      className="fa-solid"
      label={bind(Embermug).as((mug) => mug.Connected && mug.HasLiquid ? "\uf7b6" : "\uf0f4")} />
    <label label={bind(Embermug).as((mug) => mugLabel(mug, units))} />
  </BarItem>
}
