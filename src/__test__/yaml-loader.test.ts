import yamlLoader from '../yaml-loader';
import * as fs from 'fs';
import path from 'path';
describe('Ghii Yaml Loader', () => {
  it('export a function', () => {
    expect(typeof yamlLoader).toBe('function');
  });

  describe('to create a loader', () => {
    it('create a file loader from yaml file - check if is a function', async () => {
      const yamlFileLoader = yamlLoader({ throwOnError: false }, __dirname, 'test.yaml');
      await expect(typeof yamlFileLoader).toBe('function');
    });

    it('attempt to read not existent file throw Error', async () => {
      expect(() => {
        yamlLoader({ throwOnError: true }, __dirname, 'test_not_exist.yaml');
      }).toThrow();
    });
    it('attempt to read not existent file with no throw Error options', async () => {
      expect(() => {
        yamlLoader({ throwOnError: false }, __dirname, 'test_not_exist.yaml');
      }).not.toThrow();
    });

    it('attempt to read a folder throw Error', async () => {
      expect(yamlLoader({ throwOnError: true }, __dirname)).rejects.toBeInstanceOf(Error);
    });
    it('attempt to read a folder with no throw Error', async () => {
      expect(await yamlLoader({ throwOnError: false }, __dirname)()).toStrictEqual({});
    });

    it('create a file loader from yaml file', async () => {
      const content = await yamlLoader({ throwOnError: true }, __dirname, 'test.yaml')();
      await expect(content).toStrictEqual({
        foo: {
          ciao: 'mondo',
        },
      });
    });

    it('create a file loader from yaml file removed after init', async () => {
      const src = path.join(__dirname, '../__test__/test.yaml');
      const copy = path.join(__dirname, '../__test__/test-temp-copy.yaml');
      if (fs.existsSync(copy)) fs.rmSync(copy);
      fs.copyFileSync(src, copy);
      const fileLoader = await yamlLoader({ throwOnError: true }, __dirname, 'test-temp-copy.yaml');
      fs.rmSync(copy);
      await expect(fileLoader()).rejects.toBeInstanceOf(Error);
    });
    it('create a file loader from yaml file removed after init with no throw', async () => {
      const src = path.join(__dirname, '../__test__/test.yaml');
      const copy = path.join(__dirname, '../__test__/test-temp-copy.yaml');
      if (fs.existsSync(copy)) fs.rmSync(copy);
      fs.copyFileSync(src, copy);
      const fileLoader = await yamlLoader({ throwOnError: false }, __dirname, 'test-temp-copy.yaml');
      fs.rmSync(copy);
      await expect(fileLoader()).resolves.toStrictEqual({});
    });
  });
});
