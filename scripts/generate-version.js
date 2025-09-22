import { writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const versionFilePath = resolve(__dirname, '../public/version.json');

function resolveCommitHash() {
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch (error) {
    return 'unknown';
  }
}

function buildIdentifier(commitHash, timestamp) {
  const hash = createHash('sha256');
  hash.update(`${commitHash}|${timestamp}`);
  return hash.digest('hex').slice(0, 16);
}

function main() {
  const commitHash = resolveCommitHash();
  const buildTimestamp = new Date().toISOString();
  const buildId = buildIdentifier(commitHash, buildTimestamp);

  const payload = {
    commitHash,
    buildTimestamp,
    buildId
  };

  writeFileSync(versionFilePath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Generated version.json with commit ${commitHash} and buildId ${buildId}`);
}

main();
