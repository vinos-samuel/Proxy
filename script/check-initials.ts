import { getInitials } from "../client/src/lib/initials";

const cases: Array<[string | null | undefined, string]> = [
  ["Casey Nguyen", "CN"],
  ["Morgan Lee", "ML"],
  ["Madonna", "MA"],
  ["  Priya Sharma  ", "PS"],
  ["Jean-Luc Picard", "JP"],
  ["", "?"],
  [null, "?"],
  [undefined, "?"],
  ["A", "A"],
];

let failed = 0;
for (const [input, expected] of cases) {
  const got = getInitials(input);
  if (got !== expected) {
    console.error(`FAIL getInitials(${JSON.stringify(input)}) => ${got}, expected ${expected}`);
    failed++;
  }
}

if (failed > 0) {
  process.exit(1);
}
console.log(`ok — ${cases.length} initials cases`);
