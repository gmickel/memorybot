import chalk from 'chalk';
import { createCommand } from './command.js';
import { setNumContextDocumentsToRetrieve, getConfig } from '../config/index.js';

const setContextConfigCommand = createCommand(
  'context-config',
  ['cc'],
  `Sets the number of relevant documents to return from the context vector store.\n
    Arguments: \`number of documents\` (Default: 6)\n
    Example: \`/context-config 10\``,
  async (args, output) => {
    if (!args || args.length !== 1) {
      output.write(chalk.red('Invalid number of arguments. Usage: /context-config \`number of documents\`\n'));
      return;
    }
    const numContextDocumentsToRetrieve = parseInt(args[0]);
    setNumContextDocumentsToRetrieve(numContextDocumentsToRetrieve);
    const config = getConfig();
    output.write(chalk.blue(`Number of context documents to retrieve set to ${config.numContextDocumentsToRetrieve}`));
  }
);
export default setContextConfigCommand;
