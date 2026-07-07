import { ITestCase } from '../../modules/problems/problem.model';

const MAIN_PATTERN =
  /\bint\s+main\s*\(\s*(?:void|int\s+argc\s*,\s*(?:char\s*\*\s*)?argv\s*(?:\[\s*\])?)?\s*\)/;

function escapeCppString(value: string): string {
  return JSON.stringify(value);
}

/**
 * Transform user code with int main() into a single program that runs all test
 * cases in one process (one compile, one sandbox run).
 */
export function buildBatchProgram(userCode: string, testCases: ITestCase[]): string | null {
  if (!MAIN_PATTERN.test(userCode)) return null;

  const userMainReplaced = userCode.replace(MAIN_PATTERN, 'int __user_main()');

  const inputs = testCases.map((tc) => escapeCppString(tc.input));
  const expected = testCases.map((tc) => escapeCppString(tc.expectedOutput));

  return `#include <bits/stdc++.h>
#include <sstream>
using namespace std;

${userMainReplaced}

static string trimOut(const string& s) {
  size_t start = 0;
  while (start < s.size() && (s[start] == ' ' || s[start] == '\\n' || s[start] == '\\r' || s[start] == '\\t')) start++;
  size_t end = s.size();
  while (end > start && (s[end - 1] == ' ' || s[end - 1] == '\\n' || s[end - 1] == '\\r' || s[end - 1] == '\\t')) end--;
  return s.substr(start, end - start);
}

int main() {
  ios::sync_with_stdio(false);
  vector<string> inputs = { ${inputs.join(', ')} };
  vector<string> expected = { ${expected.join(', ')} };
  for (int i = 0; i < (int)inputs.size(); i++) {
    stringstream in(inputs[i]);
    stringstream out;
    streambuf* old_in = cin.rdbuf(in.rdbuf());
    streambuf* old_out = cout.rdbuf(out.rdbuf());
    __user_main();
    cin.rdbuf(old_in);
    cout.rdbuf(old_out);
    string actual = trimOut(out.str());
    string exp = trimOut(expected[i]);
    cout << "CA|" << i << "|" << (actual == exp ? "1" : "0") << "|" << actual << "\\n";
  }
  return 0;
}
`;
}

export interface ParsedBatchLine {
  index: number;
  passed: boolean;
  actualOutput: string;
}

export function parseBatchOutput(stdout: string | null): ParsedBatchLine[] {
  if (!stdout) return [];

  const lines: ParsedBatchLine[] = [];
  for (const line of stdout.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('CA|')) continue;
    const parts = trimmed.split('|');
    if (parts.length < 4) continue;
    const index = parseInt(parts[1], 10);
    if (Number.isNaN(index)) continue;
    lines.push({
      index,
      passed: parts[2] === '1',
      actualOutput: parts.slice(3).join('|'),
    });
  }
  return lines;
}
