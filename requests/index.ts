import { ToggleLauncher } from "@components/bar"

function toggleWindow(args: string[], response: (response: string) => void) {
  if (args.length !== 2) {
    response(`usage: ${args[0]} [launcher|control-panel]`)
    return
  }

  switch (args[1]) {
    case "launcher":
      ToggleLauncher()
      response("")
      break
    case "control-panel":
      response("error: not implemented yet")
      break
    default:
      response(`error: unknown popup: ${args[1]}`)
  }
}

const commandLibrary = new Map<string, (args: string[], response: (response: string) => void) => void>([
  ["toggle", toggleWindow],
])

export default function HandleRequest(args: string[], response: (response: string) => void) {
  if (args.length === 0) {
    response("error: no command provided")
  }

  const command = commandLibrary.get(args[0])
  if (command === undefined) {
    response(`error: unknown command: ${args[0]}`)
    return
  }

  return command(args, response)
}
