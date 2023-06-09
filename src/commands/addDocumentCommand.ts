import chalk from 'chalk';
import createCommand from './command.js';
import { addDocument } from '../lib/contextManager.js';

const addDocumentCommand = createCommand(
  'add-docs',
  ['docs'],
  `Adds new documents from your configured docs directory to the context vector store.\n
    Usage: /add-docs example.txt example.md\n
    Supports the following file types: .txt, .md, .pdf, .docx, .csv, .epub`,
  async (args: string[], output: NodeJS.WriteStream) => {
    if (!args) {
      output.write(chalk.red('Invalid number of arguments. Usage: /add-docs example.txt example.md\n'));
      return;
    }
    await addDocument(args);
  }
);
export default addDocumentCommand;
