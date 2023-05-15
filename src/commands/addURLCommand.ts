import chalk from 'chalk';
import { createCommand } from './command.js';
import { addURL } from '../lib/contextManager.js';

const addURLCommand = createCommand(
  'add-url',
  ['url'],
  `Scrapes the content from a url and adds it to the context vector store.\n
    Arguments: \`url\`, \`Maximum number of links to follow\` (Default: 20), \`Ignore pages with less than n characters\` (Default: 200)\n
    Example: /add-url https://dociq.io 10 500`,
  async (args, output) => {
    if (!args || args.length > 3) {
      output.write(
        chalk.red(
          'Invalid number of arguments. Usage: /add-url \`url\` \`Maximum number of links to follow\` \`Ignore pages with less than n characters\`\n'
        )
      );
      return;
    }
    const url = args[0];
    const maxLinks = parseInt(args[1]) || 1000;
    const minChars = parseInt(args[2]) || 200;
    await addURL(url, maxLinks, minChars);
  }
);
export default addURLCommand;
