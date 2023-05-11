import chalk from 'chalk';
import { createCommand } from './command.js';
import { addDocument } from '../lib/contextManager.js';

const addDocumentCommand = createCommand(
  'add-docs',
  ['docs'],
  'Adds new documents from your configured docs directory to the context vector store. \n\tUsage: /add-docs example.txt example.md\n\tSupports the following file types: .txt, .md, .pdf, .docx, .csv, .epub',
  async (args, output) => {
    if (!args) {
      output.write(chalk.red('Invalid number of arguments. Usage: /add-docs example.txt example.md\n'));
      return;
    }
    await addDocument(args);
  }
);
export default addDocumentCommand;
