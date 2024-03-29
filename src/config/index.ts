import type { Options } from 'ora';
import type { Writable } from 'stream';
import { fileURLToPath } from 'url';
import path from 'path';

export function getProjectRoot() {
  const currentModulePath = fileURLToPath(import.meta.url);
  const projectRoot = path.resolve(path.dirname(currentModulePath), '..', '..');
  return projectRoot;
}

export function getDefaultOraOptions(output: Writable): Options {
  return {
    text: 'Loading',
    stream: output,
    discardStdin: false,
  };
}

const defaultConfig: Config = {
  currentVectorStoreDatabasePath: path.join(getProjectRoot(), process.env.VECTOR_STORE_DIR || 'db/default'),
  numContextDocumentsToRetrieve: 4,
  numMemoryDocumentsToRetrieve: 4,
  useWindowMemory: true,
  chunkSize: 700,
  chunkOverlap: 50,
};

let config: Config = { ...defaultConfig };

export function getConfig(): Config {
  return config;
}

export function setCurrentVectorStoreDatabasePath(currentVectorStoreDatabasePath: string) {
  config = { ...config, currentVectorStoreDatabasePath };
}

export function setNumContextDocumentsToRetrieve(numContextDocumentsToRetrieve: number) {
  config = { ...config, numContextDocumentsToRetrieve };
}

export function setNumMemoryDocumentsToRetrieve(numMemoryDocumentsToRetrieve: number) {
  config = { ...config, numMemoryDocumentsToRetrieve };
}

export function setUseWindowMemory(useWindowMemory: boolean) {
  config = { ...config, useWindowMemory };
}
