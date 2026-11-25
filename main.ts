// Worst Fix Ever: Funniest Commit Message — entry program
// (program/v1, Node 22, stdlib only).
// Writes the one funny commit message to $MAKEFUN_OUTPUT_DIR/entry.txt
// (fallback /output/entry.txt), then reads it back and verifies the bytes.
// Gates enforced before writing: exactly one line, 1 to MAX_CHARS
// characters, not only white space, no leading/trailing space.
// Character counts use Unicode code points, not UTF-16 code units,
// so the 100-character gate is exact even for astral characters.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MAX_CHARS = 100;

const LINE =
  "fix: cure the slow query by caching the error; now it fails instantly for everyone";

// Count characters as Unicode code points.
const charCount = (s: string): number => [...s].length;

// The entry must be exactly one line: no newline (or carriage return)
// anywhere, so the file is a single line of text.
if (LINE.includes("\n") || LINE.includes("\r")) {
  throw new Error("Line must be exactly one line with no newline character");
}

const trimmed = LINE.trim();
if (charCount(trimmed) === 0) {
  throw new Error("Line must not be empty or only white space");
}
if (charCount(trimmed) > MAX_CHARS) {
  throw new Error(
    `Line must be at most ${MAX_CHARS} characters, got ${charCount(trimmed)}`,
  );
}
if (trimmed !== LINE) {
  throw new Error("Line must not have leading or trailing white space");
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "entry.txt");
writeFileSync(outPath, LINE, "utf8");

const back = readFileSync(outPath, "utf8");
if (back !== LINE) {
  throw new Error("Verification failed: entry.txt does not match the line");
}

const wordCount = LINE.split(/\s+/).filter(Boolean).length;

console.log(`Wrote ${outPath}: ${LINE}`);
console.log(`Characters: ${charCount(LINE)}, words: ${wordCount}`);
