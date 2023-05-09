import dotenv from 'dotenv';
import { OpenAIChat } from 'langchain/llms/openai';
import * as readline from 'node:readline/promises';
import path from 'path';
import fs from 'fs';
import { stdin as input, stdout as output } from 'node:process';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { CallbackManager } from 'langchain/callbacks';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { DirectoryLoader, UnknownHandling } from 'langchain/document_loaders/fs/directory';
import { JSONLoader } from 'langchain/document_loaders/fs/json';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from 'langchain/prompts';
import { LLMChain } from 'langchain/chains';
import { BufferWindowMemory } from 'langchain/memory';
import { Document } from 'langchain/document';
import { oneLine } from 'common-tags';
import chalk from 'chalk';
import { oraPromise } from 'ora';
import { logChat } from './chatLogger.js';
import { createCommandHandler } from './commands.js';
import { getDefaultOraOptions } from './config.js';

dotenv.config();

const __dirname = new URL('..', import.meta.url).pathname;
const dbDirectory = path.join(__dirname, process.env.VECTOR_STORE_DIR || 'db');
const memoryDirectory = path.join(__dirname, process.env.MEMORY_VECTOR_STORE_DIR || 'memory');
const chatLogDirectory = path.join(__dirname, 'chat_logs');
const systemPromptTemplate = fs.readFileSync(path.join(__dirname, 'src/prompt.txt'), 'utf8');
const rl = readline.createInterface({ input, output });
const defaultOraOptions = getDefaultOraOptions(output);
const commandHandler: CommandHandler = createCommandHandler();
const windowMemory = new BufferWindowMemory({
  returnMessages: false,
  memoryKey: 'immediate_history',
  inputKey: 'input',
  k: 2,
});

const contextVectorStore = await loadOrCreateVectorStore(dbDirectory);
const memoryVectorStore = await loadOrCreateMemoryVectorStore(memoryDirectory);
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
    const question = sanitizeInput(input);
    const context = await getRelevantContext(contextVectorStore, question, 10);
    const history = await getRelevantContext(memoryVectorStore, question, 4);

    const response = await chain.call({ input: question, context, history });
    await updateVectorStore(memoryVectorStore, memoryDirectory, [
      { content: question, metadataType: 'question' },
      { content: response.text, metadataType: 'answer' },
    ]);
    await logChat(chatLogDirectory, question, response.response);
  }
  output.write('\n');
}

/**
 * This function loads or creates a vector store using HNSWLib and OpenAIEmbeddings.
 * @param {string} dbDirectory - The directory where the vector store database will be saved or loaded
 * from.
 * @returns The function `loadOrCreateVectorStore` returns a Promise that resolves to an instance of
 * the `HNSWLib` class, which is a vector store used for storing and searching high-dimensional
 * vectors.
 */
async function loadOrCreateVectorStore(dbDirectory: string): Promise<HNSWLib> {
  let vectorStore: HNSWLib;
  try {
    vectorStore = await HNSWLib.load(dbDirectory, new OpenAIEmbeddings());
  } catch {
    output.write(chalk.blue(`Creating a new context vector store index in the ${dbDirectory} directory`) + '\n');
    const loader = new DirectoryLoader(
      path.join(__dirname, process.env.DOCS_DIR || 'docs'),
      {
        '.json': (path) => new JSONLoader(path),
        '.txt': (path) => new TextLoader(path),
        '.md': (path) => new TextLoader(path),
      },
      true,
      UnknownHandling.Ignore
    );
    const docs = await oraPromise(loader.loadAndSplit(new RecursiveCharacterTextSplitter()), {
      ...defaultOraOptions,
      text: 'Loading documents',
    });
    vectorStore = await oraPromise(HNSWLib.fromDocuments(docs, new OpenAIEmbeddings()), {
      ...defaultOraOptions,
      text: 'Creating vector store',
    });
    await vectorStore.save(dbDirectory);
  }
  return vectorStore;
}

/**
 * Loads or creates a vector store using HNSWLib and OpenAIEmbeddings used for storing our chat history.
 * @param {string} memoryDirectory - A string representing the directory path where the memory vector
 * store will be saved or loaded from.
 * @returns returns a Promise that resolves to an instance of
 * the `HNSWLib` class, which is a vector store used for storing and searching high-dimensional
 * vectors.
 */
async function loadOrCreateMemoryVectorStore(memoryDirectory: string): Promise<HNSWLib> {
  let memoryVectorStore: HNSWLib;
  try {
    memoryVectorStore = await HNSWLib.load(memoryDirectory, new OpenAIEmbeddings());
  } catch {
    output.write(chalk.blue(`Creating a new memory vector store index in the ${memoryDirectory} directory`) + '\n');
    memoryVectorStore = new HNSWLib(new OpenAIEmbeddings(), {
      space: "cosine",
      numDimensions: 1536,
    });
  }
  return memoryVectorStore;
}

/**
 * Sanitizes a string input by removing leading/trailing white spaces and replacing new
 * lines with spaces.
 * @param {string} input - The input parameter is a string that needs to be sanitized.
 * @returns The function `sanitizeInput` returns a string. The string is the input string with
 * leading and trailing whitespace removed, and all newline characters replaced with a space character.
 */
function sanitizeInput(input: string): string {
  return input.trim().replaceAll('\n', ' ');
}

/**
 * Retrieves relevant context for the given question by performing a similarity search on the provided vector store.
 * @param {HNSWLib} vectorStore - HNSWLib is a library for approximate nearest neighbor search, used to
 * search for similar vectors in a high-dimensional space.
 * @param {string} sanitizedQuestion - The sanitized version of the question that needs to be answered.
 * It is a string input.
 * @param {number} numDocuments - The `numDocuments` parameter is the number of documents that the
 * `getRelevantContext` function should retrieve from the `vectorStore` based on their similarity to
 * the `sanitizedQuestion`.
 * @returns The function `getRelevantContext` is returning a Promise that resolves to a string. The
 * string is the concatenation of the `pageContent` property of the top `numDocuments` documents
 * returned by a similarity search performed on a `vectorStore` using the `sanitizedQuestion` as the
 * query. The resulting string is trimmed and all newline characters are replaced with spaces.
 */
async function getRelevantContext(
  vectorStore: HNSWLib,
  sanitizedQuestion: string,
  numDocuments: number
): Promise<string> {
  const documents = await vectorStore.similaritySearch(sanitizedQuestion, numDocuments);
  return documents
    .map((doc) => doc.pageContent)
    .join(', ')
    .trim()
    .replaceAll('\n', ' ');
}

/**
 * Updates the vector store with new documents and saves the changes to the specified directory.
 * @param {HNSWLib} vectorStore - The `vectorStore` parameter is an instance of the `HNSWLib` class,
 * which is a library for approximate nearest neighbor search. It is used to store and search for
 * high-dimensional vectors.
 * @param {string} directory - The `directory` parameter is a string that represents the path to the
 * directory where the vector store will be saved. The vector store is a data structure used for
 * similarity search, and it contains a collection of high-dimensional vectors that represent documents
 * or other objects. The `updateVectorStore` function takes this
 * @param documents - An array of objects, where each object represents a document and has two
 * properties:
 */
async function updateVectorStore(
  vectorStore: HNSWLib,
  directory: string,
  documents: Array<{ content: string; metadataType: string }>
): Promise<void> {
  const formattedDocuments = documents.map(
    (doc) => new Document({ pageContent: doc.content, metadata: { type: doc.metadataType } })
  );
  await vectorStore.addDocuments(formattedDocuments);
  await vectorStore.save(directory);
}
