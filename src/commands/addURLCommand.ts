import chalk from 'chalk';
import { createCommand } from './command.js';
import { addURL } from '../lib/contextManager.js';

const addURLCommand = createCommand(
  'add-url',
  ['url'],
  `Scrapes the content from a url and adds it to the context vector store.
    Arguments: <url>, <Maximum number of links to follow> (Default: 20) <Number of characters a page should have to not be ignored> (Default: 200)
    Example: /add-url https://dociq.io 10 500`,
  async (args, output) => {
    if (!args || args.length > 3) {
      output.write(
        chalk.red(
          'Invalid number of arguments. Usage: /add-url <url> <Maximum number of links to follow> <Number of characters a page should have to not be ignored>\n'
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
