import chalk from 'chalk';
import { stdout as output } from 'node:process';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { JSONLoader } from 'langchain/document_loaders/fs/json';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { DocxLoader } from 'langchain/document_loaders/fs/docx';
import { EPubLoader } from 'langchain/document_loaders/fs/epub';
import { CSVLoader } from 'langchain/document_loaders/fs/csv';
import ora from 'ora';
import { MarkdownTextSplitter, RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import path from 'path';
import { getDefaultOraOptions } from '../config/index.js';
import { getDirectoryFiles } from '../utils/getDirectoryFiles.js';

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
  let spinner;
  try {
    vectorStore = await HNSWLib.load(dbDirectory, new OpenAIEmbeddings());
  } catch {
    spinner = ora({
      ...defaultOraOptions,
      text: chalk.blue(`Creating new Context Vector Store in the ${dbDirectory} directory`),
    }).start();
    const docsDirectory = path.join(__dirname, process.env.DOCS_DIR || 'docs');
    const filesToAdd = await getDirectoryFiles(docsDirectory);
    const documents = await Promise.all(filesToAdd.map((filePath) => loadAndSplitFile(filePath)));
    const flattenedDocuments = documents.reduce((acc, val) => acc.concat(val), []);
    vectorStore = await HNSWLib.fromDocuments(flattenedDocuments, new OpenAIEmbeddings());
    await vectorStore.save(dbDirectory);
    spinner.succeed();
  }
  return vectorStore;
}

async function loadAndSplitFile(filePath: string): Promise<Document<Record<string, any>>[]> {
  try {
    const fileExtension = path.extname(filePath);
    let loader;
    let documents: Document<Record<string, any>>[];
    switch (fileExtension) {
      case '.json':
        loader = new JSONLoader(filePath);
        documents = await loader.loadAndSplit(new RecursiveCharacterTextSplitter());
        break;
      case '.txt':
        loader = new TextLoader(filePath);
        documents = await loader.loadAndSplit(new RecursiveCharacterTextSplitter());
        break;
      case '.md':
        loader = new TextLoader(filePath);
        documents = await loader.loadAndSplit(new MarkdownTextSplitter());
        break;
      case '.pdf':
        loader = new PDFLoader(filePath, { splitPages: false });
        documents = await loader.loadAndSplit(new RecursiveCharacterTextSplitter());
        break;
      case '.docx':
        loader = new DocxLoader(filePath);
        documents = await loader.loadAndSplit(new RecursiveCharacterTextSplitter());
        break;
      case '.csv':
        loader = new CSVLoader(filePath);
        documents = await loader.loadAndSplit(new RecursiveCharacterTextSplitter());
        break;
      case '.epub':
        loader = new EPubLoader(filePath, { splitChapters: false });
        documents = await loader.loadAndSplit(new RecursiveCharacterTextSplitter());
        break;
      default:
        throw new Error(`Unsupported file extension: ${fileExtension}`);
    }
    return documents;
  } catch (error) {
    throw error;
  }
}

async function addDocument(filePaths: string[]) {
  let spinner;
  try {
    spinner = ora({ ...defaultOraOptions, text: `Adding files to the Context Vector Store` }).start();
    const docsDirectory = path.join(__dirname, process.env.DOCS_DIR || 'docs');
    const documents = await Promise.all(
      filePaths.map((filePath) => loadAndSplitFile(path.join(docsDirectory, filePath)))
    );
    const flattenedDocuments = documents.reduce((acc, val) => acc.concat(val), []);
    const vectorStore = await getContextVectorStore();
    await vectorStore.addDocuments(flattenedDocuments);
    await vectorStore.save(dbDirectory);
    spinner.succeed();
    return;
  } catch (error) {
    if (spinner) {
      spinner.fail(chalk.red(error));
    } else {
      output.write(chalk.red(error));
    }
    return;
  }
}
export { getContextVectorStore, addDocument };
