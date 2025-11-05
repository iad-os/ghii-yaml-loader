import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { Loader } from '@ghii/ghii-v2';
import yaml from 'js-yaml';

/**
 * Creates a YAML file loader function for use with GHII configuration manager.
 *
 * This function generates a loader that reads and parses a YAML file from the filesystem.
 * The loader supports customizable error handling and logging, making it suitable for
 * various deployment scenarios where configuration files may or may not be present.
 *
 * @template T - The expected shape of the configuration object. Must extend `Record<string, unknown>`.
 *               Defaults to `Record<string, unknown>` if not specified.
 *
 * @param options - Configuration options for the loader.
 * @param options.throwOnError - If `true`, throws errors when file operations fail.
 *                               If `false` (default), returns an empty object `{}` on errors.
 * @param options.logger - Custom logging function called when errors occur.
 *                         Receives the error object and a message string.
 *                         Defaults to `console.log(message, err)`.
 * @param filePathToken - Variable number of path segments that will be joined together
 *                        to form the absolute file path using `path.join()`.
 *                        Example: `yamlLoader(options, '/path/to', 'config.yaml')`
 *
 * @returns A `Loader` function that returns a Promise resolving to the parsed YAML content.
 *          The loader will:
 *          - Return the parsed YAML as a typed object `T` on success
 *          - Throw an error if `throwOnError: true` and an error occurs
 *          - Return `{}` (typed as `T`) if `throwOnError: false` and an error occurs
 *
 * @example
 * ```typescript
 * // Basic usage with error throwing
 * const loader = yamlLoader(
 *   { throwOnError: true },
 *   __dirname,
 *   'config.yaml'
 * );
 * const config = await loader();
 *
 * // Usage with custom logger
 * const loader = yamlLoader(
 *   {
 *     throwOnError: false,
 *     logger: (err, msg) => console.error(msg, err),
 *   },
 *   __dirname,
 *   'config.yaml'
 * );
 *
 * // Type-safe usage
 * interface AppConfig {
 *   database: { host: string; port: number };
 * }
 * const loader = yamlLoader<AppConfig>(
 *   { throwOnError: true },
 *   __dirname,
 *   'config.yaml'
 * );
 * const config = await loader(); // typed as AppConfig
 * ```
 */
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
  /**
   * Internal loader function that performs the actual file reading and YAML parsing.
   *
   * @returns Promise that resolves to the parsed YAML content as type T
   * @throws Error if `throwOnError` is true and file operations fail
   */
  return async function yamlFileLoader(): Promise<T> {
    // Check if file exists synchronously before attempting to read
    if (!existsSync(sourcePath)) {
      logger(
        {
          msg: 'not exist',
        },
        `${sourcePath} 404`,
      );
      if (throwOnError) throw new Error(`${sourcePath} 404`);
      // Return empty object if throwOnError is false
      return {} as T;
    }
    try {
      // Verify that the path points to a file, not a directory
      const fstat = await stat(sourcePath);
      if (fstat.isFile()) {
        // Read and parse the YAML file
        const yamlContent = await readFile(sourcePath, {
          encoding: 'utf8',
        });
        return yaml.load(yamlContent) as T;
      }
      // Path exists but is not a file (likely a directory)
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
      // Handle cases where file is deleted after loader creation or other I/O errors
      const msg = `FILE DELETED OR A DIRECTORY-> ${sourcePath} 404: ${err instanceof Error ? err.message : ''}`;
      logger(err, msg);
      if (throwOnError) throw new Error(msg);
      return {} as T;
    }
  };
}

export { yamlLoader };
