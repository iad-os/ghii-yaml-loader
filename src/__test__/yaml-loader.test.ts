import { existsSync, rmSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import yamlLoader from '../yaml-loader';
import { describe, it, expect } from 'vitest';

describe('Ghii Yaml Loader', () => {
  it('export a function', () => {
    expect(typeof yamlLoader).toBe('function');
  });

  describe('to create a loader', () => {
    it('create a file loader from yaml file - check if is a function', async () => {
      const yamlFileLoader = yamlLoader(
        {
          throwOnError: false,
        },
        __dirname,
        'test.yaml',
      );
      await expect(typeof yamlFileLoader).toBe('function');
    });

    it('attempt to read not existent file throw Error', async () => {
      expect(
        yamlLoader(
          {
            throwOnError: true,
          },
          __dirname,
          'test_not_exist.yaml',
        )(),
      ).rejects.toBeInstanceOf(Error);
    });
    it('attempt to read not existent file with no throw Error options', async () => {
      expect(
        yamlLoader(
          {
            throwOnError: false,
          },
          __dirname,
          'test_not_exist.yaml',
        )(),
      ).resolves.toStrictEqual({});
    });

    it('attempt to read a folder throw Error', async () => {
      expect(
        yamlLoader(
          {
            throwOnError: true,
          },
          __dirname,
        )(),
      ).rejects.toBeInstanceOf(Error);
    });
    it('attempt to read a folder with no throw Error', async () => {
      expect(
        await yamlLoader(
          {
            throwOnError: false,
          },
          __dirname,
        )(),
      ).toStrictEqual({});
    });

    it('create a file loader from yaml file', async () => {
      const content = await yamlLoader(
        {
          throwOnError: true,
        },
        __dirname,
        'test.yaml',
      )();
      await expect(content).toStrictEqual({
        foo: {
          ciao: 'mondo',
        },
      });
    });

    it('create a file loader from yaml file removed after init', async () => {
      const src = path.join(__dirname, '../__test__/test.yaml');
      const copy = path.join(__dirname, '../__test__/test-temp-copy.yaml');
      if (existsSync(copy)) rmSync(copy);
      copyFileSync(src, copy);
      const fileLoader = await yamlLoader(
        {
          throwOnError: true,
        },
        __dirname,
        'test-temp-copy.yaml',
      );
      rmSync(copy);
      await expect(fileLoader()).rejects.toBeInstanceOf(Error);
    });
    it('create a file loader from yaml file removed after init with no throw', async () => {
      const src = path.join(__dirname, '../__test__/test.yaml');
      const copy = path.join(__dirname, '../__test__/test-temp-copy.yaml');
      if (existsSync(copy)) rmSync(copy);
      copyFileSync(src, copy);
      const fileLoader = await yamlLoader(
        {
          throwOnError: false,
        },
        __dirname,
        'test-temp-copy.yaml',
      );
      rmSync(copy);
      await expect(fileLoader()).resolves.toStrictEqual({});
    });
  });
});
