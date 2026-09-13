// Kör parserns självtestfall: `npm run check`.

import { classifyLines } from './parse';
import { parseCases } from './parse.test-cases';

let failed = 0;

for (const c of parseCases) {
  const actual = classifyLines(c.input).map((l) => l.type);
  const ok =
    actual.length === c.expected.length && actual.every((type, i) => type === c.expected[i]);
  if (ok) {
    console.log(`  OK    ${c.name}`);
  } else {
    failed++;
    console.log(`  FEL   ${c.name}`);
    console.log(`        förväntat: ${c.expected.join(', ')}`);
    console.log(`        fick:      ${actual.join(', ')}`);
  }
}

console.log(`\n${parseCases.length - failed}/${parseCases.length} fall godkända.`);

if (failed > 0) {
  const proc = (globalThis as { process?: { exitCode?: number } }).process;
  if (proc) proc.exitCode = 1;
}
