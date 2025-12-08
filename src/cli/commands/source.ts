import { pullScript } from '../../lib/sync';
import { getCachedScript, getCacheContent } from '../../lib/cache';

export async function sourceCommand(name: string): Promise<void> {
  if (!name) {
    console.error('Usage: cs source <name>');
    console.error('');
    console.error('Output script content for sourcing into current shell.');
    console.error('Example: eval "$(cs source my-aliases)"');
    process.exit(1);
  }

  try {
    // Get script content (pull if not cached)
    let cached = getCachedScript(name);
    if (!cached) {
      await pullScript(name);
      cached = getCachedScript(name);
    }

    if (!cached) {
      console.error(`Error: Script '${name}' not found.`);
      process.exit(1);
    }

    // Warn if not a source type script
    if (cached.script_type === 'executable') {
      console.error(`# Warning: '${name}' is an executable script, not a source script.`);
      console.error(`# Consider using 'cs run ${name}' instead.`);
    }

    const content = getCacheContent(name);
    if (!content) {
      console.error(`Error: Failed to read script content for '${name}'.`);
      process.exit(1);
    }

    // Output the script content for eval
    console.log(content);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}
