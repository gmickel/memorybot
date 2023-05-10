// config.ts
import type { Options } from 'ora';
import type { Writable } from 'stream';

export function getDefaultOraOptions(output: Writable): Options {
  return {
    text: 'Loading',
    stream: output,
    discardStdin: false,
  };
}
