// Worst Fix Ever: Funniest Commit Message — entry program
// (program/v2, Node 22, stdlib only).
//
// The entry is a single commit message for a fix that made everything
// worse. Rather than hard-coding one line and hoping it is funny, this
// program keeps a small hand-written candidate set, scores every
// candidate with a deterministic scorer, and writes the winner to
// $MAKEFUN_OUTPUT_DIR/entry.txt (fallback /output/entry.txt).
//
// The scorer rewards exactly what makes a "worst fix" joke land:
// a concrete destructive action, a twist after a semicolon, an
// escalation that keeps making things worse, and a deadpan punch
// ending. No randomness anywhere: same candidates, same winner,
// every run. The winner is then checked against the competition
// gates — exactly one line, 1 to 100 characters, no leading or
// trailing space — written out, and read back to verify the bytes.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MAX_CHARS = 100;

// Every candidate is a complete "fix:" commit message. Each one
// follows the same joke shape — a plausible fix, then a twist that
// reveals the fix destroyed something worse — so the scorer can
// compare like with like instead of comparing different jokes.
const CANDIDATES: string[] = [
  "fix: cure the memory leak by deleting the database; no data, no leak, no users, no problem",
  "fix: silence the 3am alert by deleting the monitor; zero incidents since, technically",
  "fix: cure the slow query by caching the error; now it fails instantly for everyone",
  "fix: stop the crash by rethrowing the error louder; prod now crashes in surround sound",
  "fix: speed up login by skipping the password check; everyone is now an admin, congratulations",
  "fix: stop duplicate charges by charging everyone twice up front; support calls now come pre-batched",
  "fix: fix the race condition by making everything wait forever; no more races, no more users",
  "fix: stop the timeout by removing the timeout; the request from Tuesday is still loading",
  "fix: patch the leak by rebooting prod every 5 minutes; uptime is now a rumor",
  "fix: hide the bug by deleting the error log; users now crash silently, in peace",
  "fix: fix the slow page by removing the page; load time now 0ms, users 0",
  "fix: stop the outage by unplugging the status page; if nobody can see it, it is not down",
  "fix: end the flaky test by deleting the test; green build, zero confidence, ship it",
];

// Count characters as Unicode code points, not UTF-16 code units,
// so the 100-character gate is exact even for astral characters.
const charCount = (s: string): number => [...s].length;

const countMatches = (s: string, pattern: RegExp): number =>
  s.match(pattern)?.length ?? 0;

// Deterministic humour scorer. Every term is deliberate:
//   - a "fix:" prefix and a semicolon twist are the genre's grammar;
//   - naming a concrete victim (database, monitor, prod) beats a
//     vague complaint, because the worst fix is specific;
//   - an escalation ("no data, no leak, no users") is the joke
//     getting worse in public, which is the whole point of the field;
//   - a deadpan punch ending ("no problem", "technically", "in
//     peace") lands the line instead of trailing off;
//   - irony markers ("now", "since", "zero") sell that the author
//     thinks this is a success;
//   - length in the 70-95 window leaves room for a setup and a
//     punch without padding, so lines outside it lose points.
const scoreCandidate = (line: string): number => {
  let score = 0;
  const lower = line.toLowerCase();

  if (lower.startsWith("fix:")) score += 5;
  if (line.includes(";")) score += 15;

  // Concrete victim: the thing the fix destroyed.
  for (const victim of ["database", "monitor", "prod", "password check", "status page", "error log", "query", "page"]) {
    if (lower.includes(victim)) score += 4;
  }

  // Destructive verb: the fix itself is the damage.
  for (const verb of ["deleting", "removing", "skipping", "rebooting", "unplugging", "caching the error"]) {
    if (lower.includes(verb)) score += 6;
  }

  // Escalation: repeated "no X" clauses piling up the damage.
  const noClauses = countMatches(lower, /no [a-z]+/g);
  score += noClauses * 9;
  if (lower.includes("no more")) score += 6;

  // Deadpan punch endings.
  if (lower.endsWith("no problem")) score += 14;
  if (lower.endsWith("technically")) score += 10;
  if (lower.endsWith("in peace")) score += 8;
  if (lower.endsWith("is now a rumor")) score += 8;
  if (lower.endsWith("it is not down")) score += 8;
  if (lower.includes("congratulations")) score += 6;

  // Irony markers: the author reporting disaster as a win.
  for (const marker of ["now", "since", "zero", "everyone", "still"]) {
    if (lower.includes(marker)) score += 3;
  }

  // A number or a time makes the damage feel measured and real.
  if (/\d/.test(line)) score += 5;
  if (lower.includes("tuesday") || lower.includes("3am")) score += 4;

  // Sweet-spot length: long enough for setup + twist, short enough
  // to stay a commit message rather than a paragraph.
  const len = charCount(line);
  if (len >= 70 && len <= 95) score += 10;
  else if (len >= 60 && len < 70) score += 4;
  else if (len > 95) score -= 8;

  return score;
};

const validateLine = (line: string): void => {
  if (line.includes("\n") || line.includes("\r")) {
    throw new Error("Line must be exactly one line with no newline character");
  }
  const trimmed = line.trim();
  if (charCount(trimmed) === 0) {
    throw new Error("Line must not be empty or only white space");
  }
  if (charCount(trimmed) > MAX_CHARS) {
    throw new Error(
      `Line must be at most ${MAX_CHARS} characters, got ${charCount(trimmed)}`,
    );
  }
  if (trimmed !== line) {
    throw new Error("Line must not have leading or trailing white space");
  }
};

// Drop any candidate that could never pass the gates, so the scorer
// can only ever crown a legal entry.
const eligible = CANDIDATES.filter((line) => {
  const clean = line.trim();
  return (
    clean === line &&
    !line.includes("\n") &&
    !line.includes("\r") &&
    charCount(line) > 0 &&
    charCount(line) <= MAX_CHARS
  );
});
if (eligible.length === 0) {
  throw new Error("No candidate passes the entry gates");
}

// Score, then sort by score (high first). Ties break on the line
// itself, alphabetically, so the winner is fully deterministic.
const scored = eligible
  .map((line) => ({ line, score: scoreCandidate(line) }))
  .sort((a, b) => b.score - a.score || a.line.localeCompare(b.line));

const winner = scored[0];
const runnerUp = scored[1];
validateLine(winner.line);

const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "entry.txt");
writeFileSync(outPath, winner.line, "utf8");

const back = readFileSync(outPath, "utf8");
if (back !== winner.line) {
  throw new Error("Verification failed: entry.txt does not match the line");
}

const wordCount = winner.line.split(/\s+/).filter(Boolean).length;

console.log(`Wrote ${outPath}: ${winner.line}`);
console.log(
  `Characters: ${charCount(winner.line)}, words: ${wordCount}, score: ${winner.score}`,
);
console.log(
  `Runner-up (${runnerUp.score}): ${runnerUp.line}`,
);
