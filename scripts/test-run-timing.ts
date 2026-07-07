import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from '../src/database/connection';
import { runAgainstTestCases } from '../src/services/execution/test-runner';

const SOLUTION = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    long long sum = 0;
    for (int i = 0; i < n; i++) { int x; cin >> x; sum += x; }
    cout << sum;
    return 0;
}`;

const TESTS = [
  { input: '4\n10 20 30 40', expectedOutput: '100' },
  { input: '2\n0 0', expectedOutput: '0' },
  { input: '3\n100 -50 25', expectedOutput: '75' },
];

async function main() {
  const started = Date.now();
  const summary = await runAgainstTestCases(SOLUTION, TESTS, {
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    markPublic: true,
  });
  console.log('elapsed ms:', Date.now() - started);
  console.log('status:', summary.status);
  console.log('passed:', `${summary.passedCount}/${summary.totalCount}`);
  summary.testResults.forEach((t, i) => {
    console.log(`test ${i}:`, t.passed ? 'PASS' : 'FAIL', '| actual:', JSON.stringify(t.actualOutput));
  });
}

main()
  .catch(console.error)
  .finally(() => disconnectDatabase().catch(() => undefined));
