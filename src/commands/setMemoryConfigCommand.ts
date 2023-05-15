import chalk from 'chalk';
import { createCommand } from './command.js';
import { setNumMemoryDocumentsToRetrieve, getConfig } from '../config/index.js';

const setMemoryConfigCommand = createCommand(
  'memory-config',
  ['mc'],
  `Sets the number of relevant documents to return from the memory vector store.\n
    Arguments: \`number of documents\` (Default: 4)\n
    Example: /memory-config 10`,
  async (args, output) => {
    if (!args || args.length !== 1) {
      output.write(chalk.red('Invalid number of arguments. Usage: /memory-config \`number of documents\`\n'));
      return;
    }
    const numMemoryDocumentsToRetrieve = parseInt(args[0]);
    setNumMemoryDocumentsToRetrieve(numMemoryDocumentsToRetrieve);
    const config = getConfig();
    output.write(chalk.blue(`Number of memory documents to retrieve set to ${config.numMemoryDocumentsToRetrieve}`));
  }
);
export default setMemoryConfigCommand;
