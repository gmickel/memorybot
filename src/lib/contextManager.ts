import chalk from 'chalk';
import { stdout as output } from 'node:process';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { JSONLoader } from 'langchain/document_loaders/fs/json';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { DirectoryLoader, UnknownHandling } from 'langchain/document_loaders/fs/directory';
import { oraPromise } from 'ora';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { getDefaultOraOptions } from '../config/index.js';
import path from 'path';

const __dirname = new URL('../..', import.meta.url).pathname;
const defaultOraOptions = getDefaultOraOptions(output);
const dbDirectory = path.join(__dirname, process.env.VECTOR_STORE_DIR || 'db');

let contextVectorStore = await loadOrCreateVectorStore(dbDirectory);

const contextWrapper = {
  contextInstance: contextVectorStore,
};

async function getContextVectorStore() {
  return contextWrapper.contextInstance;
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

export { getContextVectorStore };
