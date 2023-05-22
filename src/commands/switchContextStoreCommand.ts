import chalk from 'chalk';
import createCommand from './command.js';
import { loadOrCreateEmptyVectorStore } from '../lib/contextManager.js';

const changeContextStoreCommand = createCommand(
  'change-context-store',
  ['ccs'],
  `Loads an existing or creates a new empty context vector store as a subdirectory of the db directory.\n
    Arguments: \`subdirectory\`\n
    Example: /change-context-store newcontext`,
  async (args, output) => {
    if (!args || args.length !== 1) {
      output.write(chalk.red('Invalid number of arguments. Usage: /change-context-store `subdirectory`\n'));
      return;
    }
    const subDirectory = args[0];
    await loadOrCreateEmptyVectorStore(subDirectory);
  }
);
export default changeContextStoreCommand;
