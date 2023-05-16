import chalk from 'chalk';
import createCommand from './command.js';

const helpCommand = createCommand(
  'help',
  ['h', '?'],
  'Show the list of available commands',
  (_args, output, commandHandler) =>
    new Promise<void>((resolve) => {
      output.write(chalk.blue('Usage:\n'));
      output.write('Ask memorybot to write some marketing materials and press enter.\n');
      output.write(chalk.blue('\nAvailable commands:\n'));
      commandHandler.getCommands().forEach((command) => {
        const aliases = command.aliases.length > 0 ? ` (/${command.aliases.join(', /')})` : '';
        output.write(chalk.yellow(`/${command.name}${aliases}`));
        output.write(` - ${command.description}`);
        output.write('\n');
      });
      resolve();
    })
);

export default helpCommand;
