export interface CommandInterface {
  name: string
  argc: number
  help: string
  usage: string
  execute(args: string[]): string
}
