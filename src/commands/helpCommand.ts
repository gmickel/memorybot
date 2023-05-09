import chalk from 'chalk';
import { createCommand } from './command.js';

const helpCommand = createCommand(
  'help',
  ['h', '?'],
  'Show the list of available commands',
  (_args, output, commandHandler) => {
    return new Promise<void>((resolve) => {
      output.write(chalk.blue('\nAvailable commands:\n'));
      for (const command of commandHandler.getCommands()) {
        const aliases = command.aliases.length > 0 ? ` (/${command.aliases.join(', /')})` : '';
        output.write(`/${command.name}${aliases} - ${command.description}\n`);
      }
      resolve();
    });
  }
);

export default helpCommand;
