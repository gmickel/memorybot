type Command = {
  name: string;
  aliases: string[];
  description: string;
  execute: (args: string[], output: NodeJS.WriteStream, commandHandler: CommandHandler) => Promise<void>;
};

type CommandHandler = {
  getCommands: () => Command[];
  execute: (commandName: string, args: string[], output: NodeJS.WriteStream) => Promise<void>;
};

type Page = {
  url: string;
  text: string;
  title: string;
};

interface Config {
  currentVectorStoreDatabasePath: string;
  numContextDocumentsToRetrieve: number;
  numMemoryDocumentsToRetrieve: number;
  useWindowMemory: boolean;
}
