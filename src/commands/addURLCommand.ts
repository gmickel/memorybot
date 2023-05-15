import chalk from 'chalk';
import { createCommand } from './command.js';
import { addURL } from '../lib/contextManager.js';

const addURLCommand = createCommand(
  'add-url',
  ['url'],
  `Scrapes the content from a url and adds it to the context vector store.\n
    Arguments: \`url\`, \`selector to extract\` (Default: body), \`Maximum number of links to follow\` (Default: 20), \`Ignore pages with less than n characters\` (Default: 200)\n
    Example: /add-url https://dociq.io main 10 500\n
    This operation may try to generate a large number of embeddings depending on the structure of the web pages and may lead to rate-limiting.\n
    To avoid this, you can try to target a specific selector such as \`.main\``,
  async (args, output) => {
    if (!args || args.length > 4) {
      output.write(
        chalk.red(
          'Invalid number of arguments. Usage: /add-url `url` `selector to extract` `Maximum number of links to follow` `Ignore pages with less than n characters`\n'
        )
      );
      return;
    }
    const url = args[0];
    const selector = args[1];
    const maxLinks = parseInt(args[2]) || 20;
    const minChars = parseInt(args[3]) || 200;
    await addURL(url, selector, maxLinks, minChars);
  }
);
export default addURLCommand;
