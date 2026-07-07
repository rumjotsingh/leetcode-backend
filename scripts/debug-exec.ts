import 'dotenv/config';
import axios from 'axios';

const BASE = process.env.EXECUTION_API_URL as string;
const TOKEN = process.env.EXECUTION_API_TOKEN as string;

const CODE = `#include <bits/stdc++.h>
using namespace std;
int main(){int n;cin>>n;long long s=0;for(int i=0;i<n;i++){int x;cin>>x;s+=x;}cout<<s;return 0;}`;

async function main() {
  const client = axios.create({
    baseURL: BASE,
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': TOKEN },
    timeout: 60000,
  });

  const started = Date.now();
  const res = await client.post(
    '/submissions',
    { source_code: CODE, language_id: 54, stdin: '3\n1 2 3', expected_output: '6' },
    { params: { wait: true, base64_encoded: false } }
  );
  console.log('elapsed ms:', Date.now() - started);
  console.log('RAW RESPONSE:');
  console.log(JSON.stringify(res.data, null, 2));
}

main().catch((e) => {
  if (e.response) console.log('HTTP', e.response.status, JSON.stringify(e.response.data, null, 2));
  else console.log('ERR', e.message);
  process.exit(1);
});
