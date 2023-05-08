import chalk from 'chalk';
import { createCommand } from './command.js';

const helpCommand = createCommand('help', 'Show the list of available commands', (_args, output, commandHandler) => {
  output.write(chalk.blue('\nAvailable commands:\n'));
  for (const command of commandHandler.getCommands()) {
    output.write(`/${command.name} - ${command.description}\n`);
  }
});

export default helpCommand;
