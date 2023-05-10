import dotenv from 'dotenv';
import { OpenAIChat } from 'langchain/llms/openai';
import * as readline from 'node:readline/promises';
import path from 'path';
import fs from 'fs';
import { stdin as input, stdout as output } from 'node:process';
import { CallbackManager } from 'langchain/callbacks';
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from 'langchain/prompts';
import { LLMChain } from 'langchain/chains';
import { oneLine } from 'common-tags';
import chalk from 'chalk';
import { logChat } from './chatLogger.js';
import { createCommandHandler } from './commands.js';
import { getMemoryVectorStore, addDocumentsToMemoryVectorStore, getBufferWindowMemory } from './lib/memoryManager.js';
import { getContextVectorStore } from './lib/contextManager.js';
import { getRelevantContext } from './lib/vectorStoreUtils.js';
import { sanitizeInput } from './utils/string.js';

dotenv.config();

const __dirname = new URL('..', import.meta.url).pathname;
const chatLogDirectory = path.join(__dirname, 'chat_logs');
const systemPromptTemplate = fs.readFileSync(path.join(__dirname, 'src/prompt.txt'), 'utf8');
const rl = readline.createInterface({ input, output });
const commandHandler: CommandHandler = createCommandHandler();
const contextVectorStore = await getContextVectorStore();
const callbackManager = CallbackManager.fromHandlers({
  async handleLLMNewToken(token: string) {
    output.write(token);
  },
});

const llm = new OpenAIChat({
  streaming: true,
  callbackManager,
  modelName: process.env.MODEL || 'gpt-3.5-turbo',
});

const systemPrompt = SystemMessagePromptTemplate.fromTemplate(oneLine`
  ${systemPromptTemplate}
`);

const chatPrompt = ChatPromptTemplate.fromPromptMessages([
  systemPrompt,
  HumanMessagePromptTemplate.fromTemplate('QUESTION: """{input}"""'),
]);

let windowMemory = getBufferWindowMemory();

const chain = new LLMChain({
  prompt: chatPrompt,
  memory: windowMemory,
  llm,
});

while (true) {
  output.write(chalk.green('\nStart chatting or type /help for a list of commands\n'));
  const input = await rl.question('> ');
  if (input.startsWith('/')) {
    const [command, ...args] = input.slice(1).split(' ');
    commandHandler.execute(command, args, output);
  } else {
    let memoryVectorStore = await getMemoryVectorStore();
    const question = sanitizeInput(input);
    const context = await getRelevantContext(contextVectorStore, question, 10);
    const history = await getRelevantContext(memoryVectorStore, question, 4);
    const response = await chain.call({ input: question, context, history, immediate_history: '' });
    await addDocumentsToMemoryVectorStore([
      { content: question, metadataType: 'question' },
      { content: response.text, metadataType: 'answer' },
    ]);
    await logChat(chatLogDirectory, question, response.response);
  }
  output.write('\n');
}
