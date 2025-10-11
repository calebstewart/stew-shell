import PopupCommand from "@requests/commands/popup"
import { CommandInterface } from "@requests/command"

const CommandLibrary: Array<CommandInterface> = [
  new PopupCommand(),
];

export default function HandleRequest(args: string[], response: (response: string) => void) {
  if (args.length === 0) {
    response("error: no command provided (try 'help')")
  }

  if (args[0] === "help") {
    const output = "Commands:\n" + CommandLibrary.map((cmd) => `  ${cmd.name}: ${cmd.help}`).join("\n")
    response(output)
    return
  }

  for (const command of CommandLibrary.values()) {
    if (command.name === args[0]) {
      if (command.argc !== args.length) {
        response(`usage: ${args[0]} ${command.usage}`)
        return
      } else {
        response(command.execute(args))
        return
      }
    }
  }
}
