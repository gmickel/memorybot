import chalk from 'chalk';
import createCommand from './command.js';
import { listContextStores } from '../lib/contextManager.js';

const listContextStoresCommand = createCommand(
  'list-context-stores',
  ['lcs'],
  `Lists all available context vector stores and their details.\n`,
  async (args, output) => {
    if (!args || args.length > 0) {
      output.write(chalk.red('Invalid number of arguments. Usage: /list-context-stores\n'));
      return;
    }
    await listContextStores();
  }
);
export default listContextStoresCommand;
