import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { join } from 'path';
import { Logger } from '@nestjs/common';

const logger = new Logger('Configuration');

const CONFIG_FILE = process.env.CONFIG_FILE || join(__dirname, '..', '..', 'config', 'application.yaml');

/**
 * 설정 파일을 읽어서 메모리에 로드하는 스크립트
 */
export default () => {
  logger.log(`Loading configuration file: ${CONFIG_FILE}`);
  const loaded = yaml.load(
    fs.readFileSync(CONFIG_FILE, 'utf8'),
  );
  if (typeof loaded === 'number' || typeof loaded === 'string')
    throw new TypeError('Loaded configuration data type is invalid: should be object, dictionary');
  logger.debug(JSON.stringify(loaded, null, 4));
  return loaded;
};
