import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commandsDir = path.join(__dirname, 'src', 'commands');
const readmePath = path.join(__dirname, 'README.md');

const commandFiles = fs.readdirSync(commandsDir).filter((file) => file !== 'command.ts');

async function getCommandsMarkdown() {
  const commands = [];
  for (const file of commandFiles) {
    const commandModule = await import(path.join(commandsDir, file));
    const command = commandModule.default;
    const aliases = command.aliases.length > 0 ? ` (${command.aliases.map(alias => `/${alias}`).join(', ')})` : '';
    commands.push(`- \`/${command.name}\`${aliases} - ${command.description}`);
  }
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
