#!/usr/bin/env node
// PostToolUse-Hook (Edit|Write): prueft nach jeder Aenderung an einer
// mobile/**/*.ts(x)-Datei automatisch mit tsc --noEmit, damit Typfehler
// sofort auffallen statt erst beim naechsten manuellen Check.
const { spawnSync } = require('child_process');
const path = require('path');

let raw = '';
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const filePath = input && input.tool_input && input.tool_input.file_path;
  if (typeof filePath !== 'string') process.exit(0);

  const normalized = filePath.replace(/\\/g, '/');
  const isMobileTs = /(^|\/)mobile\/.*\.tsx?$/.test(normalized);
  if (!isMobileTs) process.exit(0);

  const mobileDir = path.join(__dirname, '..', '..', 'mobile');
  const result = spawnSync('npx', ['tsc', '--noEmit'], {
    cwd: mobileDir,
    stdio: 'inherit',
    shell: true,
  });
  process.exit(result.status === null ? 1 : result.status);
});
