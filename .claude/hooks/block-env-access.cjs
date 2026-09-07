#!/usr/bin/env node
// PreToolUse-Hook (Read|Edit): blockt Zugriff auf .env*-Dateien (ausser
// .env.example), damit Secrets (Supabase-Keys, TMDB, OpenAI, OAuth-Client-
// Secrets) nicht versehentlich im Chat landen.
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

  const base = filePath.replace(/\\/g, '/').split('/').pop() || '';
  const isEnvFile = /^\.env(\..*)?$/.test(base);
  const isAllowed = base === '.env.example';

  if (isEnvFile && !isAllowed) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          'Zugriff auf ' + base + ' ist per Hook gesperrt (Secrets-Schutz). ' +
          'Falls wirklich noetig, den Wert gezielt per Bash-Befehl abfragen statt die Datei zu lesen/bearbeiten.',
      },
    }));
  }
  process.exit(0);
});
