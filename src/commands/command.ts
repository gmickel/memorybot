function createCommand(
  name: string,
  description: string,
  execute: (args: string[], output: NodeJS.WriteStream, commandHandler: CommandHandler) => void
): Command {
  return { name, description, execute };
}

export { createCommand };
