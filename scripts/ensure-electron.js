#!/usr/bin/env node
import { existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const electronBinary = join(process.cwd(), 'node_modules/electron/dist/Electron.app');

if (!existsSync(electronBinary)) {
  console.log('⚠️  Electron binary missing, installing...');
  execSync('node node_modules/electron/install.js', { stdio: 'inherit' });
  console.log('✓ Electron binary installed');
}
