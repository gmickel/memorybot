import path from 'path';
import fs from 'fs';

export async function getDirectoryFiles(directoryPath: string): Promise<string[]> {
  const fileNames = await fs.promises.readdir(directoryPath);
  const filePaths = [];
  for (const fileName of fileNames) {
    const filePath = path.join(directoryPath, fileName);
    const stat = await fs.promises.stat(filePath);
    if (stat.isDirectory()) {
      const subDirectoryFiles = await getDirectoryFiles(filePath);
      filePaths.push(...subDirectoryFiles);
    } else {
      filePaths.push(filePath);
    }
  }
  return filePaths;
}
