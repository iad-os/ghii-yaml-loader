import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { Loader } from '@ghii/ghii-v2';
import yaml from 'js-yaml';

export default function yamlLoader<T extends Record<string, unknown> = Record<string, unknown>>(
  {
    throwOnError,
    logger = (err, message) => console.log(message, err),
  }: {
    throwOnError?: boolean;
    logger?: (err: unknown, message: string) => void;
  },
  ...filePathToken: string[]
): Loader {
  const sourcePath = path.join(...filePathToken);
  return async function yamlFileLoader(): Promise<T> {
    if (!existsSync(sourcePath)) {
      logger(
        {
          msg: 'not exist',
        },
        `${sourcePath} 404`,
      );
      if (throwOnError) throw new Error(`${sourcePath} 404`);
    }
    try {
      const fstat = await stat(sourcePath);
      if (fstat.isFile()) {
        const yamlContent = await readFile(sourcePath, {
          encoding: 'utf8',
        });
        return yaml.load(yamlContent) as T;
      }
      const msg = `Source ${sourcePath} is not a file`;
      logger(
        {
          msg,
        },
        msg,
      );
      if (throwOnError) {
        throw new Error(msg);
      }
      return {} as T;
    } catch (err) {
      const msg = `FILE DELETED OR A DIRECTORY-> ${sourcePath} 404: ${err instanceof Error ? err.message : ''}`;
      logger(err, msg);
      if (throwOnError) throw new Error(msg);
      return {} as T;
    }
  };
}

export { yamlLoader };
