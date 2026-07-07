import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from '../src/database/connection';
import { Problem } from '../src/modules/problems/problem.model';
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

async function main() {
  await connectDatabase();
  const problem = await Problem.findOne({ slug: 'sum-of-array-elements' });
  if (!problem) throw new Error('problem not found');

  const started = Date.now();
  const summary = await runAgainstTestCases(SOLUTION, problem.testCases, {
    timeLimitMs: problem.timeLimit,
    memoryLimitMb: problem.memoryLimit,
  });
  const elapsed = Date.now() - started;

  console.log('status:', summary.status);
  console.log('passed:', `${summary.passedCount}/${summary.totalCount}`);
  console.log('avg runtime ms:', summary.runtime);
  console.log('elapsed ms:', elapsed);
  console.log('first failing (if any):', summary.testResults.find((t) => !t.passed)?.actualOutput ?? 'none');

  await disconnectDatabase();
}

main().catch(async (e) => {
  console.error(e);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
