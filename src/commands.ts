import chalk from 'chalk';
import helpCommand from './commands/helpCommand.js';

function createCommandHandler(): CommandHandler {
  const commands: Command[] = [helpCommand];

  function getCommands() {
    return commands;
  }

  function execute(commandName: string, args: string[], output: NodeJS.WriteStream) {
    const command = commands.find((cmd) => cmd.name === commandName);
    if (command) {
      command.execute(args, output, commandHandler);
    } else {
      output.write(chalk.red('Unknown command. Type /help to see the list of available commands.\n'));
    }
  }

  const commandHandler: CommandHandler = { getCommands, execute };
  return commandHandler;
}

export { createCommandHandler };
