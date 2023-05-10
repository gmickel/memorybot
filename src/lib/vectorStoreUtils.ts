import { HNSWLib } from 'langchain/vectorstores/hnswlib';

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

export { getRelevantContext };
