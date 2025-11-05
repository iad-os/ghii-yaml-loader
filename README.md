# @ghii/yaml-loader

A YAML file loader for the [GHII configuration manager](https://github.com/iad-os/ghii) (v2). This package provides a flexible and robust way to load configuration data from YAML files with customizable error handling and logging.

## Features

- 🎯 **Type-safe**: Built with TypeScript and provides full type definitions
- 🔒 **Error handling**: Configurable error handling with `throwOnError` option
- 📝 **Custom logging**: Support for custom logger functions
- ✅ **File validation**: Validates file existence and ensures the path points to a file (not a directory)
- 🚀 **Async/await**: Built on modern async/await patterns

## Installation

```bash
npm install @ghii/yaml-loader
```

### Peer Dependencies

This package requires `@ghii/ghii-v2` as a peer dependency:

```bash
npm install @ghii/ghii-v2
```

## Requirements

- Node.js >= 22.0.0

## Usage

### Basic Usage with GHII

The `yamlLoader` function returns a loader that can be used directly with GHII's `.loader()` method:

```typescript
import { ghii } from '@ghii/ghii-v2';
import { z } from 'zod';
import yamlLoader from '@ghii/yaml-loader';

// Define your configuration schema
const schema = z.object({
  server: z.object({
    port: z.number(),
    host: z.string(),
  }),
  database: z.object({
    url: z.string(),
    poolSize: z.number(),
  }),
});

// Create GHII instance with validation engine
const config = ghii({
  validate: (data) => {
    const result = schema.safeParse(data);
    return result.success
      ? { success: true, value: result.data }
      : { success: false, errors: result.error.issues.map(issue => ({
          path: issue.path.join('.'),
          input: issue.input,
          details: issue.code,
          message: issue.message,
          _raw: issue,
        })) };
  },
  toSchema: () => ({
    type: 'object',
    properties: {
      server: { type: 'object', properties: { port: { type: 'number' }, host: { type: 'string' } } },
      database: { type: 'object', properties: { url: { type: 'string' }, poolSize: { type: 'number' } } },
    },
  }),
})
  // Use yamlLoader as a loader
  .loader(yamlLoader(
    { throwOnError: true },
    __dirname,
    'config.yaml'
  ));

// Take a snapshot (validates and loads configuration)
const snapshot = await config.takeSnapshot();
console.log(snapshot.server.port);
```

### With Multiple Loaders

You can chain multiple loaders together, with later loaders overriding earlier ones:

```typescript
import { ghii } from '@ghii/ghii-v2';
import yamlLoader from '@ghii/yaml-loader';

const config = ghii(validationEngine)
  // Default configuration from YAML
  .loader(yamlLoader(
    { throwOnError: false },
    __dirname,
    'defaults.yaml'
  ))
  // Environment-specific overrides
  .loader(yamlLoader(
    { throwOnError: false },
    __dirname,
    `config.${process.env.NODE_ENV}.yaml`
  ))
  // Local development overrides (optional, won't fail if missing)
  .loader(yamlLoader(
    { throwOnError: false },
    __dirname,
    'config.local.yaml'
  ));

const snapshot = await config.takeSnapshot();
```

### With Custom Logger

```typescript
import { ghii } from '@ghii/ghii-v2';
import yamlLoader from '@ghii/yaml-loader';

const config = ghii(validationEngine)
  .loader(yamlLoader(
    {
      throwOnError: false,
      logger: (err, message) => {
        console.error(`[YAML Loader] ${message}`, err);
      },
    },
    __dirname,
    'config.yaml'
  ));

const snapshot = await config.takeSnapshot();
```

### Type-Safe Configuration

```typescript
import { ghii } from '@ghii/ghii-v2';
import { z } from 'zod';
import yamlLoader from '@ghii/yaml-loader';

interface AppConfig {
  server: {
    port: number;
    host: string;
  };
  database: {
    url: string;
    poolSize: number;
  };
}

const schema = z.object({
  server: z.object({
    port: z.number(),
    host: z.string(),
  }),
  database: z.object({
    url: z.string(),
    poolSize: z.number(),
  }),
});

const config = ghii<AppConfig>({
  validate: (data) => {
    const result = schema.safeParse(data);
    return result.success
      ? { success: true, value: result.data }
      : { success: false, errors: result.error.issues.map(/* ... */) };
  },
  toSchema: () => ({}),
})
  .loader(yamlLoader<AppConfig>(
    { throwOnError: true },
    __dirname,
    'config.yaml'
  ));

const snapshot = await config.takeSnapshot();
// snapshot is typed as AppConfig
console.log(snapshot.server.port);
```

### Event Handling with GHII

GHII supports event listeners for configuration changes:

```typescript
import { ghii } from '@ghii/ghii-v2';
import yamlLoader from '@ghii/yaml-loader';

const config = ghii(validationEngine)
  .loader(yamlLoader(
    { throwOnError: true },
    __dirname,
    'config.yaml'
  ));

// Listen for first configuration load
config.once('ghii:first', () => {
  console.log('Configuration loaded for the first time');
});

// Listen for configuration changes
config.on('ghii:refresh', (activeConfig) => {
  console.log('Configuration updated:', {
    version: activeConfig.version,
    config: activeConfig.config,
  });
});

await config.takeSnapshot();
```

## Integration with GHII

This loader is designed to work seamlessly with [GHII configuration manager](https://github.com/iad-os/ghii/tree/next). The loader function returned by `yamlLoader` implements the `Loader` interface from `@ghii/ghii-v2` and can be used directly with GHII's `.loader()` method.

### How It Works

1. **Create a loader**: `yamlLoader()` returns a function that reads and parses a YAML file
2. **Chain with GHII**: Use the returned loader with GHII's `.loader()` method
3. **Validate**: GHII validates the loaded configuration using your validation engine
4. **Take snapshot**: Call `takeSnapshot()` to get the validated configuration

### Best Practices

- Use `throwOnError: false` for optional configuration files (e.g., `config.local.yaml`)
- Use `throwOnError: true` for required configuration files
- Chain multiple loaders to support configuration layering (defaults → environment → local)
- Always validate configuration using GHII's validation engine

## Error Handling

The loader supports two error handling modes:

### Throw on Error (default: `false`)

When `throwOnError: true`, the loader will throw errors for:

- Missing files (404)
- Paths pointing to directories instead of files
- File read errors (e.g., file deleted after loader creation)

```typescript
import { ghii } from '@ghii/ghii-v2';
import yamlLoader from '@ghii/yaml-loader';

const config = ghii(validationEngine)
  .loader(yamlLoader(
    {
      throwOnError: true,
    },
    __dirname,
    'config.yaml'
  ));

try {
  const snapshot = await config.takeSnapshot();
} catch (error) {
  console.error('Failed to load config:', error);
}
```

### Graceful Error Handling (default)

When `throwOnError: false`, the loader returns an empty object `{}` on errors and logs them via the logger function. This is useful for optional configuration files:

```typescript
import { ghii } from '@ghii/ghii-v2';
import yamlLoader from '@ghii/yaml-loader';

const config = ghii(validationEngine)
  // Required config
  .loader(yamlLoader(
    { throwOnError: true },
    __dirname,
    'config.yaml'
  ))
  // Optional local overrides (won't fail if missing)
  .loader(yamlLoader(
    {
      throwOnError: false,
      logger: (err, message) => console.warn(message),
    },
    __dirname,
    'config.local.yaml'
  ));

// Returns {} for optional loader if file doesn't exist, but continues with other loaders
const snapshot = await config.takeSnapshot();
```

## API

### `yamlLoader<T>(options, ...filePathToken): Loader`

Creates a YAML file loader function.

#### Parameters

**`options`** (object)

- `throwOnError?: boolean` (optional, default: `false`)
  - When `true`, throws errors instead of returning empty objects
- `logger?: (err: unknown, message: string) => void` (optional, default: `console.log`)
  - Custom logging function called when errors occur
  - Receives the error object and a message string

**`...filePathToken`** (string[])

- Path segments that will be joined together to form the file path
- Uses `path.join()` to combine the segments
- Example: `yamlLoader(options, '/path/to', 'config', 'app.yaml')` → `/path/to/config/app.yaml`

#### Returns

A `Loader` function (from `@ghii/ghii-v2`) that:

- Returns a `Promise<T>` where `T` extends `Record<string, unknown>`
- Resolves with the parsed YAML content as a JavaScript object
- Rejects with an error if `throwOnError: true` and an error occurs
- Resolves with `{}` if `throwOnError: false` and an error occurs

#### Type Parameters

- `T extends Record<string, unknown>` - The expected shape of the configuration object

## Error Scenarios

The loader handles several error scenarios:

1. **File doesn't exist**: Logs a 404 message
2. **Path is a directory**: Logs "Source {path} is not a file"
3. **File deleted after loader creation**: Logs "FILE DELETED OR A DIRECTORY"
4. **YAML parsing errors**: Handled by `js-yaml` library

## Example YAML File

```yaml
# config.yaml
database:
  host: localhost
  port: 5432
  name: myapp

server:
  port: 3000
  timeout: 5000
```

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Lint

```bash
npm run lint
```

## License

MIT

## Related Projects

- [GHII Configuration Manager](https://github.com/iad-os/ghii/tree/next) - The main configuration management library

## Repository

[GitHub](https://github.com/iad-os/ghii-yaml-loader)

## Maintainer

Daniele Fiungo <daniele.fiungo@iad2.it>
