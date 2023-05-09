/**
 * The function creates a command object with a name, aliases, description, and an execute function.
 * @param {string} name - A string representing the name of the command.
 * @param {string[]} aliases - The `aliases` parameter is an array of strings that represent
 * alternative names for the command. These aliases can be used in place of the command name when
 * executing the command. For example, if a command has the name "list" and an alias of "ls", then the
 * user can execute the command. Pass an empty array if the command has no aliases.
 * @param {string} description - A brief description of what the command does.
 * @param execute - The `execute` parameter is a function that takes in three arguments:
 * @returns A `Command` object is being returned.
 */
function createCommand(
  name: string,
  aliases: string[],
  description: string,
  execute: (args: string[], output: NodeJS.WriteStream, commandHandler: CommandHandler) => void
): Command {
  return { name, aliases, description, execute };
}
export { createCommand };
