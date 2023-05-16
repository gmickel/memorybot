/**
 * The function creates a command object with a name, aliases, description, and an execute function
 * that returns a Promise.
 * @param {string} name - A string representing the name of the command.
 * @param {string[]} aliases - An array of alternative names that can be used to call the command. For
 * example, if the command is named "help", aliases could include "h" or "info".
 * @param {string} description - A brief description of what the command does.
 * @param execute - The `execute` parameter is a function that takes in three arguments:
 * @returns A `Command` object is being returned.
 */
function createCommand(
  name: string,
  aliases: string[],
  description: string,
  execute: (args: string[], output: NodeJS.WriteStream, commandHandler: CommandHandler) => Promise<void>
): Command {
  return { name, aliases, description, execute };
}
export default createCommand;
