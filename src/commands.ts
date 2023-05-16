import chalk from 'chalk';
import helpCommand from './commands/helpCommand.js';
import quitCommand from './commands/quitCommand.js';
import resetChatCommand from './commands/resetChatCommand.js';
import addDocumentCommand from './commands/addDocumentCommand.js';
import addURLCommand from './commands/addURLCommand.js';
import addYouTubeCommand from './commands/addYouTubeCommand.js';
import setContextConfigCommand from './commands/setContextConfigCommand.js';
import setMemoryConfigCommand from './commands/setMemoryConfigCommand.js';
import toggleWindowBufferMemory from './commands/toggleWindowBufferMemory.js';

function createCommandHandler(): CommandHandler {
  const commands: Command[] = [
    helpCommand,
    quitCommand,
    resetChatCommand,
    addDocumentCommand,
    addURLCommand,
    addYouTubeCommand,
    setContextConfigCommand,
    setMemoryConfigCommand,
    toggleWindowBufferMemory,
  ];

  function getCommands() {
    return commands;
  }

  const commandHandler: CommandHandler = {
    getCommands,
    async execute(commandName: string, args: string[], output: NodeJS.WriteStream) {
      const command = commands.find((cmd) => cmd.name === commandName || cmd.aliases.includes(commandName));
      if (command) {
        await command.execute(args, output, commandHandler);
      } else {
        output.write(chalk.red('Unknown command. Type /help to see the list of available commands.\n'));
      }
    },
  };
  return commandHandler;
}

export default createCommandHandler;
