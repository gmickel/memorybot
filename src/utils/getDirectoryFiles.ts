import path from 'path';
import fs from 'fs';

export default async function getDirectoryFiles(directoryPath: string): Promise<string[]> {
  const fileNames = await fs.promises.readdir(directoryPath);

  const filePathsPromises = fileNames.map(async (fileName) => {
    const filePath = path.join(directoryPath, fileName);
    const stat = await fs.promises.stat(filePath);

    if (stat.isDirectory()) {
      const subDirectoryFiles = await getDirectoryFiles(filePath);
      return subDirectoryFiles;
    }
      return filePath;

  });

  const filePathsArray = await Promise.all(filePathsPromises);
  const filePaths = filePathsArray.flat();
  return filePaths;
}
