import chalk from 'chalk';
import { createCommand } from './command.js';
import { resetBufferWindowMemory, resetMemoryVectorStore, setMemoryVectorStore } from '../lib/memoryManager.js';

const resetChatCommand = createCommand(
  'reset',
  [],
  'Resets the chat and starts a new conversation',
  async (_args, output) => {
    output.write(chalk.yellow('\nResetting the chat!\n'));
    await resetMemoryVectorStore((newMemoryVectorStore) => {
      setMemoryVectorStore(newMemoryVectorStore);
    });
    resetBufferWindowMemory();
  }
);
export default resetChatCommand;
