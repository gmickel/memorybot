import fs from 'fs';
import path from 'path';
import { getProjectRoot } from './src/config/index.js';

const projectRootDir = getProjectRoot();

const commandsDir = path.join(projectRootDir, 'src', 'commands');
const readmePath = path.join(projectRootDir, 'README.md');

const commandFiles = fs.readdirSync(commandsDir).filter((file) => file !== 'command.ts');

async function getCommandsMarkdown() {
  const commandsPromises = commandFiles.map(async (file) => {
    const commandModule = await import(path.join(commandsDir, file));
    const command = commandModule.default;
    const aliases =
      command.aliases.length > 0 ? ` (${command.aliases.map((alias: string) => `/${alias}`).join(', ')})` : '';
    return `- \`/${command.name}\`${aliases} - ${command.description}`;
  });

  const commands = await Promise.all(commandsPromises);
  return commands.join('\n');
}

(async () => {
  const commandsMarkdown = await getCommandsMarkdown();
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const updatedReadmeContent = readmeContent.replace(
    /<!-- COMMANDS_START -->([\s\S]*?)<!-- COMMANDS_END -->/,
    `<!-- COMMANDS_START -->\n${commandsMarkdown}\n<!-- COMMANDS_END -->`
  );

  fs.writeFileSync(readmePath, updatedReadmeContent, 'utf8');
})();
