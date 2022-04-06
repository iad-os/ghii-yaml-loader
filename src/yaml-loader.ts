import { Loader } from '@ghii/ghii';
import yaml from 'js-yaml';
import * as fs from 'fs';
import { promisify } from 'util';
import path from 'path';
const stat = promisify(fs.stat);

const readFile = promisify(fs.readFile);

export default function yamlLoader(
  {
    throwOnError,
    logger = (err, message) => console.log(message, err),
  }: { throwOnError?: boolean; logger: (err: unknown, message: string) => void },
  ...filePathToken: string[]
): Loader {
  const sourcePath = path.join(...filePathToken);
  if (!fs.existsSync(sourcePath)) {
    logger({ msg: 'not exist' }, `${sourcePath} 404`);
    if (throwOnError) throw new Error(`${sourcePath} 404`);
  }
  return async function yamlFileLoader() {
    try {
      const fstat = await stat(sourcePath);
      if (fstat.isFile()) {
        const yamlContent = await readFile(sourcePath, { encoding: 'utf8' });
        return yaml.safeLoad(yamlContent) as { [key: string]: unknown };
      }
      throw new Error(`Source ${sourcePath} is not a file`);
    } catch (err) {
      const msg = `FILE DELETED OR A DIRECTORY-> ${sourcePath} 404: ${err instanceof Error ? err.message : ''}`;
      logger(err, msg);
      if (throwOnError) throw new Error(msg);
      return {};
    }
  };
}
