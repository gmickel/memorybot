import chalk from 'chalk';
import { createCommand } from './command.js';
import { addYouTube } from '../lib/contextManager.js';

const addYouTubeCommand = createCommand(
  'add-youtube',
  ['yt'],
  `Adds the transcript from a youtube video and adds it to the context vector store.
    Arguments: <youtube url> or <youtube videoid>
    Example: /add-url https://www.youtube.com/watch?v=VMj-3S1tku0`,
  async (args, output) => {
    if (!args || args.length !== 1) {
      output.write(chalk.red('Invalid number of arguments. Usage: /add-url <youtube url> or <youtube videoid>\n'));
      return;
    }
    const URLOrVideoID = args[0];
    await addYouTube(URLOrVideoID);
  }
);
export default addYouTubeCommand;
