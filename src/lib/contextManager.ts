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
import { YoutubeTranscript } from 'youtube-transcript';
import getDirectoryListWithDetails from '../utils/getDirectoryListWithDetails.js';
import createDirectory from '../utils/createDirectory.js';
import { getConfig, getDefaultOraOptions, getProjectRoot, setCurrentVectorStoreDatabasePath } from '../config/index.js';
import getDirectoryFiles from '../utils/getDirectoryFiles.js';
import WebCrawler from './crawler.js';

const projectRootDir = getProjectRoot();

const defaultOraOptions = getDefaultOraOptions(output);

/**
 * This function loads and splits a file based on its extension using different loaders and text
 * splitters.
 * @param {string} filePath - A string representing the path to the file that needs to be loaded and
 * split into documents.
 * @returns The function `loadAndSplitFile` returns a Promise that resolves to an array of `Document`
 * objects, where each `Document` represents a split portion of the input file. The type of the
 * `Document` object is `Document<Record<string, unknown>>`, which means it has a generic type
 * parameter that is an object with string keys and unknown values.
 */
async function loadAndSplitFile(filePath: string): Promise<Document<Record<string, unknown>>[]> {
  const fileExtension = path.extname(filePath);
  let loader;
  let documents: Document<Record<string, unknown>>[];
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
}

/**
 * This function loads or creates a new empty Context Vector Store using HNSWLib and OpenAIEmbeddings.
 * @returns a Promise that resolves to an instance of the HNSWLib class, which represents a
 * hierarchical navigable small world graph used for nearest neighbor search. The instance is either
 * loaded from an existing directory or created as a new empty Context Vector Store with specified
 * parameters.
 */
async function loadOrCreateEmptyVectorStore(subDirectory: string): Promise<HNSWLib> {
  let vectorStore: HNSWLib;
  let spinner;
  const newContextVectorStorePath = path.join(projectRootDir, process.env.VECTOR_STORE_BASE_DIR || 'db', subDirectory);
  await createDirectory(newContextVectorStorePath);
  setCurrentVectorStoreDatabasePath(newContextVectorStorePath);
  const dbDirectory = getConfig().currentVectorStoreDatabasePath;
  try {
    vectorStore = await HNSWLib.load(dbDirectory, new OpenAIEmbeddings({ maxConcurrency: 5 }));
    output.write(chalk.blue(`Using Context Vector Store in the ${dbDirectory} directory\n`));
  } catch {
    spinner = ora({
      ...defaultOraOptions,
      text: chalk.blue(`Creating new empty Context Vector Store in the ${dbDirectory} directory`),
    }).start();
    vectorStore = new HNSWLib(new OpenAIEmbeddings({ maxConcurrency: 5 }), {
      space: 'cosine',
      numDimensions: 1536,
    });
    spinner.succeed();
    output.write(
      chalk.red.bold(
        `\nThe Context Vector Store is currently empty and unsaved, add context to is using \`/add-docs\`, \`/add-url\` or \`/add-youtube\``
      )
    );
  }
  return vectorStore;
}

/**
 * This function loads or creates a vector store using HNSWLib and OpenAIEmbeddings.
 * @returns The function `loadOrCreateVectorStore` returns a Promise that resolves to an instance of
 * the `HNSWLib` class, which is a vector store used for storing and searching high-dimensional
 * vectors.
 */
async function loadOrCreateVectorStore(): Promise<HNSWLib> {
  let vectorStore: HNSWLib;
  let spinner;
  await createDirectory(getConfig().currentVectorStoreDatabasePath);
  const dbDirectory = getConfig().currentVectorStoreDatabasePath;
  try {
    vectorStore = await HNSWLib.load(dbDirectory, new OpenAIEmbeddings({ maxConcurrency: 5 }));
  } catch {
    spinner = ora({
      ...defaultOraOptions,
      text: chalk.blue(`Creating new Context Vector Store in the ${dbDirectory} directory`),
    }).start();
    const docsDirectory = path.join(projectRootDir, process.env.DOCS_DIR || 'docs');
    const filesToAdd = await getDirectoryFiles(docsDirectory);
    const documents = await Promise.all(filesToAdd.map((filePath) => loadAndSplitFile(filePath)));
    const flattenedDocuments = documents.reduce((acc, val) => acc.concat(val), []);
    vectorStore = await HNSWLib.fromDocuments(flattenedDocuments, new OpenAIEmbeddings({ maxConcurrency: 5 }));
    await vectorStore.save(dbDirectory);
    spinner.succeed();
  }
  return vectorStore;
}

const contextVectorStore = await loadOrCreateVectorStore();

const contextWrapper = {
  contextInstance: contextVectorStore,
};

async function getContextVectorStore() {
  return contextWrapper.contextInstance;
}

/**
 * This function adds documents to a context vector store and saves them.
 * @param {string[]} filePaths - The `filePaths` parameter is an array of strings representing the file
 * paths of the documents that need to be added to the Context Vector Store.
 * @returns nothing (`undefined`).
 */
async function addDocument(filePaths: string[]) {
  let spinner;
  const dbDirectory = getConfig().currentVectorStoreDatabasePath;
  try {
    spinner = ora({ ...defaultOraOptions, text: `Adding files to the Context Vector Store` }).start();
    const docsDirectory = path.join(projectRootDir, process.env.DOCS_DIR || 'docs');
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
  }
}

/**
 * The function adds a YouTube video transcript to a Context Vector Store.
 * @param {string} URLOrVideoID - The URLOrVideoID parameter is a string that represents either the URL
 * or the video ID of a YouTube video.
 * @returns Nothing is being returned explicitly in the code, but the function is expected to return
 * undefined after completing its execution.
 */
async function addYouTube(URLOrVideoID: string) {
  let spinner;
  const dbDirectory = getConfig().currentVectorStoreDatabasePath;
  try {
    spinner = ora({
      ...defaultOraOptions,
      text: `Adding Video transcript from ${URLOrVideoID} to the Context Vector Store`,
    }).start();
    const transcript = await YoutubeTranscript.fetchTranscript(URLOrVideoID);
    const text = transcript.map((part) => part.text).join(' ');
    const splitter = new RecursiveCharacterTextSplitter();
    const videoDocs = await splitter.splitDocuments([
      new Document({
        pageContent: text,
      }),
    ]);
    const vectorStore = await getContextVectorStore();
    await vectorStore.addDocuments(videoDocs);
    await vectorStore.save(dbDirectory);
    spinner.succeed();
    return;
  } catch (error) {
    if (spinner) {
      spinner.fail(chalk.red(error));
    } else {
      output.write(chalk.red(error));
    }
  }
}

/**
 * The function crawls a given URL, extracts text from the pages, splits the text into documents,
 * generates embeddings for the documents, and saves them to a vector store.
 * @param {string} URL - The URL of the website to crawl and extract text from.
 * @param {string} selector - The selector parameter is a string that represents a CSS selector used to
 * identify the HTML elements to be crawled on the web page. The WebCrawler will only crawl the
 * elements that match the selector.
 * @param {number} maxPages - The maximum number of pages to crawl for the given URL.
 * @param {number} numberOfCharactersRequired - `numberOfCharactersRequired` is a number that specifies
 * the minimum number of characters required for a document to be considered valid and used for
 * generating embeddings. Any document with less than this number of characters will be discarded.
 * @returns Nothing is being returned explicitly in the function, but it is implied that the function
 * will return undefined if there are no errors.
 */
async function addURL(URL: string, selector: string, maxPages: number, numberOfCharactersRequired: number) {
  const dbDirectory = getConfig().currentVectorStoreDatabasePath;
  const addUrlSpinner = ora({ ...defaultOraOptions, text: `Crawling ${URL}` });
  let documents;
  try {
    addUrlSpinner.start();
    const progressCallback = (linksFound: number, linksCrawled: number, currentUrl: string) => {
      addUrlSpinner.text = `Links found: ${linksFound} - Links crawled: ${linksCrawled} - Crawling ${currentUrl}`;
    };

    const crawler = new WebCrawler([URL], progressCallback, selector, maxPages, numberOfCharactersRequired);
    const pages = (await crawler.start()) as Page[];

    documents = await Promise.all(
      pages.map((row) => {
        const splitter = new RecursiveCharacterTextSplitter();

        const webDocs = splitter.splitDocuments([
          new Document({
            pageContent: row.text,
          }),
        ]);
        return webDocs;
      })
    );
    addUrlSpinner.succeed();
  } catch (error) {
    addUrlSpinner.fail(chalk.red(error));
  }
  if (documents) {
    const generateEmbeddingsSpinner = ora({ ...defaultOraOptions, text: `Generating Embeddings` });
    try {
      const flattenedDocuments = documents.flat();
      generateEmbeddingsSpinner.text = `Generating Embeddings for ${flattenedDocuments.length} documents`;
      generateEmbeddingsSpinner.start();
      const vectorStore = await getContextVectorStore();
      await vectorStore.addDocuments(flattenedDocuments);
      await vectorStore.save(dbDirectory);
      generateEmbeddingsSpinner.succeed();
      return;
    } catch (error) {
      generateEmbeddingsSpinner.fail(chalk.red(error));
    }
  }
}

async function listContextStores() {
  const projectRoot = getProjectRoot(); // Please replace this with your actual function to get the project root
  const vectorStoreDir = process.env.VECTOR_STORE_BASE_DIR || 'db';
  const targetDir = path.join(projectRoot, vectorStoreDir);
  const contextVectorStoresList = await getDirectoryListWithDetails(targetDir);
  output.write(chalk.blue(`Context Vector Stores in ${targetDir}:\n\n`));
  Object.entries(contextVectorStoresList).forEach(([dir, files]) => {
    output.write(chalk.yellow(`Directory: ${dir}`));
    if (dir === getConfig().currentVectorStoreDatabasePath) {
      output.write(chalk.green(` (Currently selected)`));
    }
    output.write('\n');
    files.forEach((file) => {
      output.write(chalk.yellow(`  File: ${file.name}, Size: ${file.size} KB\n`));
    });
  });
}

export { getContextVectorStore, addDocument, addURL, addYouTube, listContextStores, loadOrCreateEmptyVectorStore };
