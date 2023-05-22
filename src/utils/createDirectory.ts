import fs from 'node:fs/promises';

export default async function createDirectory(directoryPath: string): Promise<void> {
  if (await fs.stat(directoryPath).catch(() => false)) {
    return;
  }
  await fs.mkdir(directoryPath, { recursive: true });
}
