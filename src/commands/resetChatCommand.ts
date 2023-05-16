import chalk from 'chalk';
import createCommand from './command.js';
import { resetBufferWindowMemory, resetMemoryVectorStore, setMemoryVectorStore } from '../lib/memoryManager.js';

const resetChatCommand = createCommand(
  'reset',
  [],
  'Resets the chat and starts a new conversation - This clears the memory vector store and the buffer window memory.',
  async (_args, output) => {
    output.write(chalk.yellow('\nResetting the chat!\n'));
    await resetMemoryVectorStore((newMemoryVectorStore) => {
      setMemoryVectorStore(newMemoryVectorStore);
    });
    resetBufferWindowMemory();
  }
);
export default resetChatCommand;
