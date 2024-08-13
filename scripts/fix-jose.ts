/*
 This script is used to fix an issue with next-auth with QuickBooks.
 Fix: https://github.com/nextauthjs/next-auth/issues/4554#issuecomment-1175486720
 Refer to https://blogs.intuit.com/2023/09/05/changes-to-identity-signature-keys-that-may-impact-your-application/ for more information.
*/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'jose',
  'dist',
  'node',
  'cjs',
  'runtime',
  'check_modulus_length.js'
);

try {
  const data = fs.readFileSync(targetFile, 'utf8');
  const result = data.replace(
    'if (getModulusLength(key) < 2048)',
    'if (getModulusLength(key) < 1024)'
  );
  fs.writeFileSync(targetFile, result, 'utf8');
  console.log('Successfully modified check_modulus_length.js');
} catch (err) {
  console.error('Error modifying the jose module:', err);
}
