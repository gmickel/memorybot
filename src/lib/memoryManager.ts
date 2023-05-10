import chalk from 'chalk';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import fs from 'fs/promises';
import path from 'path';
import { stdout as output } from 'node:process';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { Document } from 'langchain/document';
import { BufferWindowMemory } from 'langchain/memory';

const __dirname = new URL('../..', import.meta.url).pathname;
const memoryDirectory = path.join(__dirname, process.env.MEMORY_VECTOR_STORE_DIR || 'memory');

let memoryVectorStore: HNSWLib;
try {
  memoryVectorStore = await HNSWLib.load(memoryDirectory, new OpenAIEmbeddings());
} catch {
  output.write(chalk.blue(`Creating a new memory vector store index in the ${memoryDirectory} directory`) + '\n');
  memoryVectorStore = new HNSWLib(new OpenAIEmbeddings(), {
    space: 'cosine',
    numDimensions: 1536,
  });
}

let bufferWindowMemory = new BufferWindowMemory({
  returnMessages: false,
  memoryKey: 'immediate_history',
  inputKey: 'input',
  k: 2,
});

const memoryWrapper = {
  vectorStoreInstance: memoryVectorStore,
};

async function getMemoryVectorStore() {
  return memoryWrapper.vectorStoreInstance;
}

function getBufferWindowMemory() {
  return bufferWindowMemory;
}

async function addDocumentsToMemoryVectorStore(
  documents: Array<{ content: string; metadataType: string }>
): Promise<void> {
  const formattedDocuments = documents.map(
    (doc) => new Document({ pageContent: doc.content, metadata: { type: doc.metadataType } })
  );
  await memoryWrapper.vectorStoreInstance.addDocuments(formattedDocuments);
  await saveMemoryVectorStore();
}

async function saveMemoryVectorStore() {
  await memoryWrapper.vectorStoreInstance.save(memoryDirectory);
}

function resetBufferWindowMemory() {
  bufferWindowMemory.clear();
}

async function resetMemoryVectorStore(onReset: (newMemoryVectorStore: HNSWLib) => void) {
  const newMemoryVectorStore = new HNSWLib(new OpenAIEmbeddings(), {
    space: 'cosine',
    numDimensions: 1536,
  });
  await deleteMemoryDirectory();
  onReset(newMemoryVectorStore);
}

async function deleteMemoryDirectory() {
  try {
    const files = await fs.readdir(memoryDirectory);
    const deletePromises = files.map((file) => fs.unlink(path.join(memoryDirectory, file)));
    await Promise.all(deletePromises);
    return `All files in the memory directory have been deleted.`;
  } catch (error) {
    if (error instanceof Error) {
      return chalk.red(`All files in the memory directory have been deleted: ${error.message}`);
    } else {
      return chalk.red(`All files in the memory directory have been deleted: ${error}`);
    }
  }
}

function setMemoryVectorStore(newMemoryVectorStore: HNSWLib) {
  memoryWrapper.vectorStoreInstance = newMemoryVectorStore;
}

export {
  getMemoryVectorStore,
  setMemoryVectorStore,
  addDocumentsToMemoryVectorStore,
  resetMemoryVectorStore,
  getBufferWindowMemory,
  resetBufferWindowMemory,
};
