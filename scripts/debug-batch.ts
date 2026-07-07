import 'dotenv/config';
import axios from 'axios';
import { buildBatchProgram } from '../src/services/execution/batch-runner';

const CODE = `#include <bits/stdc++.h>
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

const tests = [
  { input: '4\n10 20 30 40', expectedOutput: '100' },
  { input: '2\n0 0', expectedOutput: '0' },
  { input: '3\n100 -50 25', expectedOutput: '75' },
];

async function main() {
  const prog = buildBatchProgram(CODE, tests);
  if (!prog) throw new Error('batch build failed');
  console.log('program length:', prog.length);

  const client = axios.create({
    baseURL: process.env.EXECUTION_API_URL,
    headers: { 'X-Auth-Token': process.env.EXECUTION_API_TOKEN },
    timeout: 60000,
  });

  const started = Date.now();
  try {
    const res = await client.post(
      '/submissions',
      {
        source_code: prog,
        language_id: 54,
        cpu_time_limit: 3,
        wall_time_limit: 15,
        memory_limit: 262144,
      },
      { params: { wait: true, base64_encoded: false } }
    );
    console.log('elapsed ms:', Date.now() - started);
    console.log('status:', res.data.status);
    console.log('stdout:', res.data.stdout);
    console.log('compile:', res.data.compile_output);
    console.log('stderr:', res.data.stderr);
    console.log('message:', res.data.message);
  } catch (e: unknown) {
    const err = e as { response?: { status: number; data: unknown } };
    console.log('ERR', err.response?.status, JSON.stringify(err.response?.data, null, 2));
  }
}

main();
