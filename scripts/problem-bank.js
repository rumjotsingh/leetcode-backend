/**
 * Problem archetype specs for dataset generation.
 * Each archetype defines OJ-evaluable stdin/stdout problems.
 */
function rangeCases(gen, count, start = 0) {
  return Array.from({ length: count }, (_, i) => gen(start + i));
}

function makeArchetype(cfg) {
  return {
    hiddenCount: 15,
    ...cfg,
    hiddenTestCases: cfg.hiddenTestCases || rangeCases(cfg.hiddenGen, 15),
    visibleTestCases: cfg.visibleTestCases || cfg.visibleTestCases,
  };
}

const ARCHETYPES = {
  array_sum: makeArchetype({
    description: 'Given an integer array of size N, compute the sum of all elements.\n\nInput:\nLine 1: N\nLine 2: N space-separated integers\n\nOutput: single integer — the sum.',
    constraints: ['1 <= N <= 10^5', '-10^9 <= each element <= 10^9', 'Sum fits in 64-bit signed integer'],
    examples: [
      { input: '3\n1 2 3', output: '6', explanation: '1+2+3=6.' },
      { input: '1\n42', output: '42', explanation: 'Single element.' },
      { input: '5\n-1 2 -3 4 0', output: '2', explanation: 'Includes negatives.' },
    ],
    visibleTestCases: [
      { input: '4\n10 20 30 40', expectedOutput: '100' },
      { input: '2\n0 0', expectedOutput: '0' },
      { input: '3\n100 -50 25', expectedOutput: '75' },
    ],
    hiddenGen: (i) => {
      const n = 5 + i;
      const arr = Array.from({ length: n }, (_, j) => ((j * 7 + i * 3) % 97) - 48);
      return { input: `${n}\n${arr.join(' ')}`, expectedOutput: String(arr.reduce((a, b) => a + b, 0)) };
    },
    cppSignature: 'long long solve(int n, vector<long long>& a)',
    cppBody: '    long long s = 0; for (auto x : a) s += x; return s;',
    io: (input) => {
      const lines = input.trim().split('\n');
      const n = +lines[0];
      const a = lines[1].split(' ').map(Number);
      return String(a.reduce((x, y) => x + y, 0));
    },
  }),

  array_min: makeArchetype({
    description: 'Given N integers, find and print the minimum value.\n\nInput:\nN\nN integers',
    constraints: ['1 <= N <= 10^5', '-10^9 <= values <= 10^9'],
    examples: [
      { input: '5\n3 9 1 7 4', output: '1', explanation: 'Minimum is 1.' },
      { input: '1\n-100', output: '-100', explanation: 'Only element.' },
      { input: '4\n5 5 5 5', output: '5', explanation: 'All equal.' },
    ],
    visibleTestCases: [
      { input: '3\n-1 -5 -2', expectedOutput: '-5' },
      { input: '4\n10 3 8 1', expectedOutput: '1' },
      { input: '2\n0 7', expectedOutput: '0' },
    ],
    hiddenGen: (i) => {
      const n = 3 + (i % 20);
      const a = Array.from({ length: n }, (_, j) => j * 3 - i);
      return { input: `${n}\n${a.join(' ')}`, expectedOutput: String(Math.min(...a)) };
    },
    cppSignature: 'int solve(int n, vector<int>& a)',
    cppBody: '    return *min_element(a.begin(), a.end());',
  }),

  array_max: makeArchetype({
    description: 'Given N integers, find and print the maximum value.\n\nInput:\nN\nN integers',
    constraints: ['1 <= N <= 10^5', '-10^9 <= values <= 10^9'],
    examples: [
      { input: '5\n3 9 1 7 4', output: '9', explanation: 'Maximum is 9.' },
      { input: '1\n-100', output: '-100', explanation: 'Only element.' },
      { input: '4\n0 0 1 0', output: '1', explanation: 'One positive.' },
    ],
    visibleTestCases: [
      { input: '3\n1 5 3', expectedOutput: '5' },
      { input: '2\n-1 -5', expectedOutput: '-1' },
      { input: '4\n0 0 1 0', expectedOutput: '1' },
    ],
    hiddenGen: (i) => {
      const n = 3 + (i % 20);
      const a = Array.from({ length: n }, (_, j) => j - i);
      return { input: `${n}\n${a.join(' ')}`, expectedOutput: String(Math.max(...a)) };
    },
    cppSignature: 'int solve(int n, vector<int>& a)',
    cppBody: '    return *max_element(a.begin(), a.end());',
  }),

  second_largest: makeArchetype({
    description: 'Given N distinct integers, print the second largest element.\n\nInput:\nN\nN distinct integers\n\nIt is guaranteed that N >= 2 and a second largest exists.',
    constraints: ['2 <= N <= 10^5', 'All elements distinct', '-10^9 <= values <= 10^9'],
    examples: [
      { input: '5\n3 9 1 7 4', output: '7', explanation: 'Largest is 9, second is 7.' },
      { input: '3\n10 20 15', output: '15', explanation: 'Second after 20.' },
      { input: '2\n1 2', output: '1', explanation: 'Only two elements.' },
    ],
    visibleTestCases: [
      { input: '4\n5 1 9 3', expectedOutput: '5' },
      { input: '3\n100 50 75', expectedOutput: '75' },
      { input: '2\n-1 -2', expectedOutput: '-2' },
    ],
    hiddenGen: (i) => {
      const n = 3 + (i % 15);
      const a = Array.from({ length: n }, (_, j) => (j + 1) * 10 + i);
      const sorted = [...a].sort((x, y) => y - x);
      return { input: `${n}\n${a.join(' ')}`, expectedOutput: String(sorted[1]) };
    },
    cppSignature: 'int solve(int n, vector<int>& a)',
    cppBody: '    sort(a.rbegin(), a.rend());\n    return a[1];',
  }),

  remove_duplicates_sorted: makeArchetype({
    description: 'Given a non-decreasing sorted array of N integers, return the count of unique elements after in-place deduplication.\n\nInput:\nN\nN sorted integers',
    constraints: ['1 <= N <= 10^5', 'Array sorted in non-decreasing order'],
    examples: [
      { input: '5\n1 1 2 2 3', output: '3', explanation: 'Unique: 1,2,3.' },
      { input: '3\n1 2 3', output: '3', explanation: 'All unique.' },
      { input: '1\n7', output: '1', explanation: 'Single element.' },
    ],
    visibleTestCases: [
      { input: '6\n1 1 1 2 2 3', expectedOutput: '3' },
      { input: '4\n5 5 5 5', expectedOutput: '1' },
      { input: '5\n0 0 1 1 2', expectedOutput: '3' },
    ],
    hiddenGen: (i) => {
      const n = 5 + (i % 10);
      const a = [];
      let v = i % 5;
      for (let j = 0; j < n; j++) { if (j > 0 && j % 2 === 0) v++; a.push(v); }
      const uniq = new Set(a).size;
      return { input: `${n}\n${a.join(' ')}`, expectedOutput: String(uniq) };
    },
    cppSignature: 'int solve(int n, vector<int>& a)',
    cppBody: '    if (n == 0) return 0;\n    int k = 1;\n    for (int i = 1; i < n; i++) if (a[i] != a[i-1]) a[k++] = a[i];\n    return k;',
  }),

  rotate_left: makeArchetype({
    description: 'Rotate array left by K positions and print the result.\n\nInput:\nN K\nN integers',
    constraints: ['1 <= N <= 10^5', '0 <= K < N'],
    examples: [
      { input: '5 2\n1 2 3 4 5', output: '3 4 5 1 2', explanation: 'Left rotate by 2.' },
      { input: '3 1\n10 20 30', output: '20 30 10', explanation: 'Rotate by 1.' },
      { input: '4 0\n1 2 3 4', output: '1 2 3 4', explanation: 'No rotation.' },
    ],
    visibleTestCases: [
      { input: '6 3\n1 2 3 4 5 6', expectedOutput: '4 5 6 1 2 3' },
      { input: '2 1\n7 8', expectedOutput: '8 7' },
      { input: '3 2\n1 2 3', expectedOutput: '3 1 2' },
    ],
    hiddenGen: (i) => {
      const n = 4 + (i % 8);
      const k = 1 + (i % (n - 1));
      const a = Array.from({ length: n }, (_, j) => j + 1);
      const r = [...a.slice(k), ...a.slice(0, k)];
      return { input: `${n} ${k}\n${a.join(' ')}`, expectedOutput: r.join(' ') };
    },
    cppSignature: 'vector<int> solve(int n, int k, vector<int>& a)',
    cppBody: '    k %= n;\n    rotate(a.begin(), a.begin() + k, a.end());\n    return a;',
  }),

  is_prime: makeArchetype({
    description: 'Given integer N, print 1 if N is prime else 0.\n\nInput: single integer N',
    constraints: ['2 <= N <= 10^6 for most tests', 'N >= 0'],
    examples: [
      { input: '7', output: '1', explanation: '7 is prime.' },
      { input: '4', output: '0', explanation: '4 is composite.' },
      { input: '2', output: '1', explanation: '2 is prime.' },
    ],
    visibleTestCases: [
      { input: '17', expectedOutput: '1' },
      { input: '15', expectedOutput: '0' },
      { input: '1', expectedOutput: '0' },
    ],
    hiddenGen: (i) => {
      const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
      const composites = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25];
      const n = i % 2 ? primes[i % primes.length] : composites[i % composites.length];
      const isP = (x) => { if (x < 2) return 0; for (let d = 2; d * d <= x; d++) if (x % d === 0) return 0; return 1; };
      return { input: String(n), expectedOutput: String(isP(n)) };
    },
    cppSignature: 'int solve(int n)',
    cppBody: '    if (n < 2) return 0;\n    for (int d = 2; 1LL * d * d <= n; d++) if (n % d == 0) return 0;\n    return 1;',
  }),

  digit_sum: makeArchetype({
    description: 'Given non-negative integer N, print the sum of its digits.',
    constraints: ['0 <= N <= 10^18'],
    examples: [
      { input: '123', output: '6', explanation: '1+2+3=6.' },
      { input: '0', output: '0', explanation: 'Zero has sum 0.' },
      { input: '9999', output: '36', explanation: '9*4=36.' },
    ],
    visibleTestCases: [
      { input: '100', expectedOutput: '1' },
      { input: '57', expectedOutput: '12' },
      { input: '8080', expectedOutput: '16' },
    ],
    hiddenGen: (i) => {
      const n = String(1000000 + i * 123456).slice(0, 6 + (i % 4));
      const s = [...n].reduce((a, c) => a + +c, 0);
      return { input: n, expectedOutput: String(s) };
    },
    cppSignature: 'int solve(long long n)',
    cppBody: '    int s = 0; while (n) { s += n % 10; n /= 10; } return s;',
  }),

  leap_year: makeArchetype({
    description: 'Given year Y, print 1 if leap year else 0.\n\nLeap: divisible by 400, or by 4 but not by 100.',
    constraints: ['1 <= Y <= 10^9'],
    examples: [
      { input: '2000', output: '1', explanation: 'Divisible by 400.' },
      { input: '1900', output: '0', explanation: 'Divisible by 100 not 400.' },
      { input: '2024', output: '1', explanation: 'Divisible by 4.' },
    ],
    visibleTestCases: [
      { input: '2023', expectedOutput: '0' },
      { input: '2100', expectedOutput: '0' },
      { input: '2400', expectedOutput: '1' },
    ],
    hiddenGen: (i) => {
      const y = 1900 + i * 7;
      const leap = (y % 400 === 0 || (y % 4 === 0 && y % 100 !== 0)) ? 1 : 0;
      return { input: String(y), expectedOutput: String(leap) };
    },
    cppSignature: 'int solve(int y)',
    cppBody: '    return (y % 400 == 0 || (y % 4 == 0 && y % 100 != 0)) ? 1 : 0;',
  }),

  abs_diff: makeArchetype({
    description: 'Given two integers A and B, print |A - B|.',
    constraints: ['-10^9 <= A,B <= 10^9'],
    examples: [
      { input: '5 9', output: '4', explanation: '|5-9|=4.' },
      { input: '-3 -7', output: '4', explanation: '|-3+7|=4.' },
      { input: '0 0', output: '0', explanation: 'Equal values.' },
    ],
    visibleTestCases: [
      { input: '10 3', expectedOutput: '7' },
      { input: '-5 5', expectedOutput: '10' },
      { input: '100 100', expectedOutput: '0' },
    ],
    hiddenGen: (i) => {
      const a = i * 13 - 100;
      const b = i * 7 + 50;
      return { input: `${a} ${b}`, expectedOutput: String(Math.abs(a - b)) };
    },
    cppSignature: 'long long solve(long long a, long long b)',
    cppBody: '    return llabs(a - b);',
  }),

  two_sum: makeArchetype({
    description: 'Given N distinct integers and target T, find indices i < j with A[i]+A[j]=T. Output i j (0-based).\n\nInput:\nN T\nN integers',
    constraints: ['2 <= N <= 10^4', 'Exactly one solution', '-10^9 <= values,T <= 10^9'],
    examples: [
      { input: '4 9\n2 7 11 15', output: '0 1', explanation: '2+7=9.' },
      { input: '3 6\n3 2 4', output: '1 2', explanation: '2+4=6.' },
      { input: '2 3\n1 2', output: '0 1', explanation: '1+2=3.' },
    ],
    visibleTestCases: [
      { input: '4 9\n2 7 11 15', expectedOutput: '0 1' },
      { input: '3 6\n3 2 4', expectedOutput: '1 2' },
      { input: '2 3\n1 2', expectedOutput: '0 1' },
    ],
    hiddenGen: (i) => {
      const n = 4 + (i % 5);
      const nums = Array.from({ length: n }, (_, j) => j + 1 + i);
      const a = i % (n - 1), b = n - 1;
      const target = nums[a] + nums[b];
      return { input: `${n} ${target}\n${nums.join(' ')}`, expectedOutput: `${a} ${b}` };
    },
    cppSignature: 'pair<int,int> solve(int n, int target, vector<int>& nums)',
    cppBody: '    unordered_map<int,int> mp;\n    for (int i = 0; i < n; i++) {\n        int need = target - nums[i];\n        if (mp.count(need)) return {mp[need], i};\n        mp[nums[i]] = i;\n    }\n    return {-1,-1};',
  }),

  palindrome_string: makeArchetype({
    description: 'Given lowercase string S, print 1 if palindrome else 0.',
    constraints: ['1 <= |S| <= 10^5'],
    examples: [
      { input: 'aba', output: '1', explanation: 'Reads same both ways.' },
      { input: 'abc', output: '0', explanation: 'Not palindrome.' },
      { input: 'a', output: '1', explanation: 'Single char.' },
    ],
    visibleTestCases: [
      { input: 'level', expectedOutput: '1' },
      { input: 'world', expectedOutput: '0' },
      { input: 'noon', expectedOutput: '1' },
    ],
    hiddenGen: (i) => {
      const base = 'ab' + String.fromCharCode(97 + (i % 10));
      const s = i % 2 ? base + base.split('').reverse().join('') : base + 'c';
      const ok = s === s.split('').reverse().join('') ? 1 : 0;
      return { input: s, expectedOutput: String(ok) };
    },
    cppSignature: 'int solve(string s)',
    cppBody: '    int l = 0, r = (int)s.size()-1;\n    while (l < r) if (s[l++] != s[r--]) return 0;\n    return 1;',
  }),

  factorial: makeArchetype({
    description: 'Compute N! for given N (0! = 1).',
    constraints: ['0 <= N <= 16'],
    examples: [
      { input: '5', output: '120', explanation: '5!=120.' },
      { input: '0', output: '1', explanation: '0!=1.' },
      { input: '3', output: '6', explanation: '3!=6.' },
    ],
    visibleTestCases: [
      { input: '1', expectedOutput: '1' },
      { input: '4', expectedOutput: '24' },
      { input: '6', expectedOutput: '720' },
    ],
    hiddenGen: (i) => {
      const n = i % 13;
      let r = 1; for (let k = 2; k <= n; k++) r *= k;
      return { input: String(n), expectedOutput: String(r) };
    },
    cppSignature: 'long long solve(int n)',
    cppBody: '    long long r = 1; for (int i = 2; i <= n; i++) r *= i; return r;',
  }),

  gcd: makeArchetype({
    description: 'Print gcd(A, B).',
    constraints: ['1 <= A,B <= 10^9'],
    examples: [
      { input: '12 18', output: '6', explanation: 'gcd(12,18)=6.' },
      { input: '7 13', output: '1', explanation: 'Coprime.' },
      { input: '100 25', output: '25', explanation: '25 divides 100.' },
    ],
    visibleTestCases: [
      { input: '8 12', expectedOutput: '4' },
      { input: '54 24', expectedOutput: '6' },
      { input: '17 13', expectedOutput: '1' },
    ],
    hiddenGen: (i) => {
      const a = 12 + i * 3, b = 18 + i * 5;
      const g = (x, y) => (y === 0 ? x : g(y, x % y));
      return { input: `${a} ${b}`, expectedOutput: String(g(a, b)) };
    },
    cppSignature: 'int solve(int a, int b)',
    cppBody: '    while (b) { int t = a % b; a = b; b = t; } return a;',
  }),

  count_bits: makeArchetype({
    description: 'Count set bits (1s) in binary representation of X.',
    constraints: ['0 <= X <= 10^9'],
    examples: [
      { input: '5', output: '2', explanation: '101 has two 1s.' },
      { input: '0', output: '0', explanation: 'No set bits.' },
      { input: '15', output: '4', explanation: '1111.' },
    ],
    visibleTestCases: [
      { input: '1', expectedOutput: '1' },
      { input: '8', expectedOutput: '1' },
      { input: '255', expectedOutput: '8' },
    ],
    hiddenGen: (i) => {
      const x = (i + 1) * 7 + 13;
      return { input: String(x), expectedOutput: String(x.toString(2).replace(/0/g, '').length) };
    },
    cppSignature: 'int solve(int x)',
    cppBody: '    int c = 0; while (x) { c += x & 1; x >>= 1; } return c;',
  }),

  fibonacci: makeArchetype({
    description: 'Print the Nth Fibonacci number with F0=0, F1=1.',
    constraints: ['0 <= N <= 45'],
    examples: [
      { input: '0', output: '0', explanation: 'F0=0.' },
      { input: '1', output: '1', explanation: 'F1=1.' },
      { input: '10', output: '55', explanation: 'F10=55.' },
    ],
    visibleTestCases: [
      { input: '2', expectedOutput: '1' },
      { input: '7', expectedOutput: '13' },
      { input: '12', expectedOutput: '144' },
    ],
    hiddenGen: (i) => {
      const n = Math.min(2 + i, 40);
      let a = 0, b = 1;
      for (let k = 2; k <= n; k++) { const c = a + b; a = b; b = c; }
      return { input: String(n), expectedOutput: String(b) };
    },
    cppSignature: 'long long solve(int n)',
    cppBody: '    if (n <= 1) return n;\n    long long a = 0, b = 1;\n    for (int i = 2; i <= n; i++) { long long c = a + b; a = b; b = c; } return b;',
  }),

  binary_search: makeArchetype({
    description: 'Given sorted ascending array of N integers and target X, print 0-based index if found else -1.',
    constraints: ['1 <= N <= 10^5', 'Array sorted ascending'],
    examples: [
      { input: '5 3\n1 2 3 4 5', output: '2', explanation: '3 at index 2.' },
      { input: '3 10\n1 3 5', output: '-1', explanation: 'Not found.' },
      { input: '1 1\n1', output: '0', explanation: 'Found at 0.' },
    ],
    visibleTestCases: [
      { input: '6 7\n1 3 5 7 9 11', expectedOutput: '3' },
      { input: '4 2\n2 4 6 8', expectedOutput: '0' },
      { input: '5 6\n1 2 3 4 5', expectedOutput: '-1' },
    ],
    hiddenGen: (i) => {
      const n = 10 + i * 2;
      const arr = Array.from({ length: n }, (_, j) => j * 2 + i);
      const target = i % 3 === 0 ? 99999 : arr[Math.min(i, n - 1)];
      const idx = arr.indexOf(target);
      return { input: `${n} ${target}\n${arr.join(' ')}`, expectedOutput: String(idx) };
    },
    cppSignature: 'int solve(int n, int target, vector<int>& a)',
    cppBody: '    int l = 0, r = n - 1;\n    while (l <= r) { int m = (l + r) / 2; if (a[m] == target) return m; if (a[m] < target) l = m + 1; else r = m - 1; } return -1;',
  }),

  sliding_window_max_sum: makeArchetype({
    description: 'Given array of N integers and window size K, find maximum sum of any contiguous subarray of length K.',
    constraints: ['1 <= K <= N <= 10^5'],
    examples: [
      { input: '5 3\n1 2 3 4 5', output: '12', explanation: '3+4+5=12.' },
      { input: '4 2\n5 5 5 5', output: '10', explanation: 'Any window.' },
      { input: '3 1\n7 1 3', output: '7', explanation: 'K=1 picks max element.' },
    ],
    visibleTestCases: [
      { input: '6 2\n1 3 2 5 4 6', expectedOutput: '9' },
      { input: '5 5\n1 2 3 4 5', expectedOutput: '15' },
      { input: '4 3\n10 1 1 10', expectedOutput: '12' },
    ],
    hiddenGen: (i) => {
      const n = 8 + i, k = 3;
      const arr = Array.from({ length: n }, (_, j) => (j + i) % 17);
      let best = -Infinity;
      for (let j = 0; j <= n - k; j++) best = Math.max(best, arr.slice(j, j + k).reduce((a, b) => a + b, 0));
      return { input: `${n} ${k}\n${arr.join(' ')}`, expectedOutput: String(best) };
    },
    cppSignature: 'long long solve(int n, int k, vector<int>& a)',
    cppBody: '    long long cur = 0, best = LLONG_MIN;\n    for (int i = 0; i < n; i++) { cur += a[i]; if (i >= k) cur -= a[i-k]; if (i >= k-1) best = max(best, cur); } return best;',
  }),

  distinct_count: makeArchetype({
    description: 'Given N integers, print count of distinct values.',
    constraints: ['1 <= N <= 10^5'],
    examples: [
      { input: '4\n1 2 2 3', output: '3', explanation: 'Distinct: 1,2,3.' },
      { input: '1\n5', output: '1', explanation: 'One value.' },
      { input: '3\n7 7 7', output: '1', explanation: 'All same.' },
    ],
    visibleTestCases: [
      { input: '5\n1 1 2 3 3', expectedOutput: '3' },
      { input: '2\n0 1', expectedOutput: '2' },
      { input: '6\n9 9 9 9 9 9', expectedOutput: '1' },
    ],
    hiddenGen: (i) => {
      const n = 5 + i;
      const a = Array.from({ length: n }, (_, j) => (j * 3) % (5 + i % 4));
      return { input: `${n}\n${a.join(' ')}`, expectedOutput: String(new Set(a).size) };
    },
    cppSignature: 'int solve(int n, vector<int>& a)',
    cppBody: '    return (int)unordered_set<int>(a.begin(), a.end()).size();',
  }),

  range_sum: makeArchetype({
    description: 'Given L and R, print sum of all integers from L to R inclusive.',
    constraints: ['0 <= L <= R <= 10^9', 'Use 64-bit arithmetic'],
    examples: [
      { input: '1 5', output: '15', explanation: '1+2+3+4+5=15.' },
      { input: '0 0', output: '0', explanation: 'Single zero.' },
      { input: '3 3', output: '3', explanation: 'Only 3.' },
    ],
    visibleTestCases: [
      { input: '1 10', expectedOutput: '55' },
      { input: '5 15', expectedOutput: '110' },
      { input: '100 200', expectedOutput: '15150' },
    ],
    hiddenGen: (i) => {
      const l = i * 3, r = l + 10 + (i % 5);
      const sum = ((r - l + 1) * (l + r)) / 2;
      return { input: `${l} ${r}`, expectedOutput: String(sum) };
    },
    cppSignature: 'long long solve(long long l, long long r)',
    cppBody: '    return (r - l + 1) * (l + r) / 2;',
  }),

  reverse_string: makeArchetype({
    description: 'Given lowercase string S without spaces, print its reverse.',
    constraints: ['1 <= |S| <= 10^5'],
    examples: [
      { input: 'hello', output: 'olleh', explanation: 'Reversed.' },
      { input: 'a', output: 'a', explanation: 'Single char.' },
      { input: 'codearena', output: 'aneraedoc', explanation: 'Full reverse.' },
    ],
    visibleTestCases: [
      { input: 'abc', expectedOutput: 'cba' },
      { input: 'race', expectedOutput: 'ecar' },
      { input: 'open', expectedOutput: 'nepo' },
    ],
    hiddenGen: (i) => {
      const s = 'test' + String.fromCharCode(97 + (i % 26)).repeat(2 + (i % 5));
      return { input: s, expectedOutput: s.split('').reverse().join('') };
    },
    cppSignature: 'string solve(string s)',
    cppBody: '    reverse(s.begin(), s.end()); return s;',
  }),

  count_vowels: makeArchetype({
    description: 'Count vowels (a,e,i,o,u) in lowercase string S.',
    constraints: ['1 <= |S| <= 10^5'],
    examples: [
      { input: 'leetcode', output: '4', explanation: 'Four vowels.' },
      { input: 'rhythm', output: '0', explanation: 'No vowels.' },
      { input: 'aeiou', output: '5', explanation: 'All vowels.' },
    ],
    visibleTestCases: [
      { input: 'hello', expectedOutput: '2' },
      { input: 'xyz', expectedOutput: '0' },
      { input: 'audio', expectedOutput: '4' },
    ],
    hiddenGen: (i) => {
      const s = 'bcdfg'.repeat(1 + (i % 3)) + 'aeiou'[i % 5].repeat(1 + (i % 2));
      const c = (s.match(/[aeiou]/g) || []).length;
      return { input: s, expectedOutput: String(c) };
    },
    cppSignature: 'int solve(string s)',
    cppBody: '    int c = 0; for (char ch : s) if (string("aeiou").find(ch) != string::npos) c++; return c;',
  }),

  valid_parentheses: makeArchetype({
    description: 'Given string of ()[]{} , print 1 if valid balanced parentheses else 0.',
    constraints: ['0 <= |S| <= 10^5'],
    examples: [
      { input: '()', output: '1', explanation: 'Valid pair.' },
      { input: '([)]', output: '0', explanation: 'Wrong order.' },
      { input: '{[]}', output: '1', explanation: 'Nested valid.' },
    ],
    visibleTestCases: [
      { input: '()[]{}', expectedOutput: '1' },
      { input: '(]', expectedOutput: '0' },
      { input: '((()))', expectedOutput: '1' },
    ],
    hiddenGen: (i) => {
      const samples = ['()', '(]', '{[()]}', '((', ')))', '[[]]', '{(})', '', '[](){}', '([{}])', '{', ')', '(([]))', '[((]))', '{[}]', '()()'];
      const s = samples[i % samples.length];
      const st = []; const pairs = { ')': '(', ']': '[', '}': '{' };
      let ok = 1;
      for (const c of s) {
        if ('({['.includes(c)) st.push(c);
        else if (c in pairs) { if (st.pop() !== pairs[c]) ok = 0; }
      }
      if (st.length) ok = 0;
      return { input: s.length ? s : '()', expectedOutput: String(ok) };
    },
    cppSignature: 'int solve(string s)',
    cppBody: "    stack<char> st;\n    unordered_map<char,char> p = {{')','('},{']','['},{'}','{'}};\n    for (char c : s) {\n        if (c=='('||c=='['||c=='{') st.push(c);\n        else { if (st.empty()||st.top()!=p[c]) return 0; st.pop(); }\n    }\n    return st.empty()?1:0;",
  }),

  max_subarray_sum: makeArchetype({
    description: 'Given N integers, find maximum sum of any non-empty contiguous subarray (Kadane).\n\nInput:\nN\nN integers',
    constraints: ['1 <= N <= 10^5', '-10^9 <= values <= 10^9'],
    examples: [
      { input: '5\n-2 1 -3 4 -1', output: '4', explanation: 'Single element 4.' },
      { input: '3\n1 2 3', output: '6', explanation: 'Whole array.' },
      { input: '1\n-5', output: '-5', explanation: 'Must pick one.' },
    ],
    visibleTestCases: [
      { input: '6\n-2 5 -1 4 -3 6', expectedOutput: '11' },
      { input: '4\n-1 -2 -3 -4', expectedOutput: '-1' },
      { input: '3\n5 -2 3', expectedOutput: '6' },
    ],
    hiddenGen: (i) => {
      const n = 5 + (i % 10);
      const a = Array.from({ length: n }, (_, j) => ((j * 7 + i * 3) % 20) - 10);
      let best = -Infinity, cur = 0;
      for (const x of a) { cur = Math.max(x, cur + x); best = Math.max(best, cur); }
      return { input: `${n}\n${a.join(' ')}`, expectedOutput: String(best) };
    },
    cppSignature: 'long long solve(int n, vector<long long>& a)',
    cppBody: '    long long best = LLONG_MIN, cur = 0;\n    for (auto x : a) { cur = max(x, cur + x); best = max(best, cur); }\n    return best;',
  }),

  coin_change: makeArchetype({
    description: 'Given coin denominations and amount A, find minimum coins needed to make A. Print -1 if impossible.\n\nInput:\nN A\nN coin values',
    constraints: ['1 <= N <= 20', '1 <= coin <= 10^4', '0 <= A <= 10^4'],
    examples: [
      { input: '3 11\n1 2 5', output: '3', explanation: '5+5+1=11 uses 3 coins.' },
      { input: '1 0\n1', output: '0', explanation: 'Amount zero.' },
      { input: '2 3\n2 5', output: '-1', explanation: 'Impossible.' },
    ],
    visibleTestCases: [
      { input: '3 6\n1 2 3', expectedOutput: '2' },
      { input: '2 7\n3 5', expectedOutput: '-1' },
      { input: '4 20\n1 5 10 20', expectedOutput: '1' },
    ],
    hiddenGen: (i) => {
      const coins = [1, 2, 5, 10];
      const a = 1 + (i % 50);
      const dp = Array(a + 1).fill(Infinity); dp[0] = 0;
      for (let x = 1; x <= a; x++) for (const c of coins) if (x >= c) dp[x] = Math.min(dp[x], dp[x - c] + 1);
      const ans = dp[a] === Infinity ? -1 : dp[a];
      return { input: `${coins.length} ${a}\n${coins.join(' ')}`, expectedOutput: String(ans) };
    },
    cppSignature: 'int solve(int n, int amount, vector<int>& coins)',
    cppBody: '    vector<int> dp(amount+1, 1e9); dp[0]=0;\n    for (int x=1;x<=amount;x++) for (int c:coins) if (x>=c) dp[x]=min(dp[x],dp[x-c]+1);\n    return dp[amount]==1e9?-1:dp[amount];',
  }),

  lcs_length: makeArchetype({
    description: 'Given two strings A and B, print length of longest common subsequence.',
    constraints: ['1 <= |A|,|B| <= 1000', 'Lowercase letters'],
    examples: [
      { input: 'abcde\nace', output: '3', explanation: 'ace has length 3.' },
      { input: 'abc\nabc', output: '3', explanation: 'Identical.' },
      { input: 'abc\ndef', output: '0', explanation: 'No common.' },
    ],
    visibleTestCases: [
      { input: 'abcd\ndcaba', expectedOutput: '2' },
      { input: 'a\na', expectedOutput: '1' },
      { input: 'xyz\nabc', expectedOutput: '0' },
    ],
    hiddenGen: (i) => {
      const a = 'abc' + String.fromCharCode(97 + (i % 5)).repeat(3);
      const b = 'a' + 'bc' + String.fromCharCode(98 + (i % 5)).repeat(2);
      const dp = Array(a.length + 1).fill(0).map(() => Array(b.length + 1).fill(0));
      for (let x = 1; x <= a.length; x++) for (let y = 1; y <= b.length; y++)
        dp[x][y] = a[x-1] === b[y-1] ? dp[x-1][y-1] + 1 : Math.max(dp[x-1][y], dp[x][y-1]);
      return { input: `${a}\n${b}`, expectedOutput: String(dp[a.length][b.length]) };
    },
    cppSignature: 'int solve(string a, string b)',
    cppBody: '    int n=a.size(),m=b.size();\n    vector<vector<int>> dp(n+1,vector<int>(m+1));\n    for(int i=1;i<=n;i++)for(int j=1;j<=m;j++)dp[i][j]=a[i-1]==b[j-1]?dp[i-1][j-1]+1:max(dp[i-1][j],dp[i][j-1]);\n    return dp[n][m];',
  }),

  bfs_shortest_path: makeArchetype({
    description: 'Unweighted directed graph: N nodes (0..N-1), M edges, source S. Print shortest distance from S to node N-1, or -1 if unreachable.\n\nInput:\nN M S\nM lines: u v',
    constraints: ['2 <= N <= 10^4', '0 <= M <= 10^5', '0 <= S < N'],
    examples: [
      { input: '4 4 0\n0 1\n1 2\n2 3\n0 3', output: '1', explanation: 'Direct 0->3.' },
      { input: '3 2 0\n0 1\n1 2', output: '2', explanation: 'Path length 2.' },
      { input: '3 0 0', output: '-1', explanation: 'No edges, cant reach 2.' },
    ],
    visibleTestCases: [
      { input: '5 4 0\n0 1\n1 2\n2 3\n3 4', expectedOutput: '4' },
      { input: '3 1 0\n0 1', expectedOutput: '-1' },
      { input: '2 1 0\n0 1', expectedOutput: '1' },
    ],
    hiddenGen: (i) => {
      const n = 5 + (i % 5);
      const edges = [];
      for (let u = 0; u < n - 1; u++) edges.push(`${u} ${u + 1}`);
      if (i % 2) edges.push(`0 ${n - 1}`);
      const dist = Array(n).fill(-1); dist[0] = 0;
      const q = [0];
      const adj = Array.from({ length: n }, () => []);
      edges.forEach((e) => { const [u, v] = e.split(' ').map(Number); adj[u].push(v); });
      while (q.length) { const u = q.shift(); for (const v of adj[u]) if (dist[v] === -1) { dist[v] = dist[u] + 1; q.push(v); } }
      return { input: `${n} ${edges.length} 0\n${edges.join('\n')}`, expectedOutput: String(dist[n - 1]) };
    },
    cppSignature: 'int solve(int n, int m, int s, vector<pair<int,int>>& edges)',
    cppBody: '    vector<vector<int>> g(n);\n    for (auto [u,v]: edges) g[u].push_back(v);\n    vector<int> d(n,-1); queue<int> q; d[s]=0; q.push(s);\n    while(!q.empty()){int u=q.front();q.pop();for(int v:g[u])if(d[v]==-1){d[v]=d[u]+1;q.push(v);}}\n    return d[n-1];',
  }),

  kth_smallest: makeArchetype({
    description: 'Given unsorted array of N integers, print Kth smallest element (1-indexed).',
    constraints: ['1 <= K <= N <= 10^4'],
    examples: [
      { input: '5 2\n3 1 4 2 5', output: '2', explanation: '2nd smallest.' },
      { input: '3 1\n9 8 7', output: '7', explanation: 'Smallest.' },
      { input: '4 4\n1 1 1 2', output: '2', explanation: '4th smallest.' },
    ],
    visibleTestCases: [
      { input: '6 3\n7 2 9 1 5 3', expectedOutput: '3' },
      { input: '1 1\n42', expectedOutput: '42' },
      { input: '5 5\n10 20 30 40 50', expectedOutput: '50' },
    ],
    hiddenGen: (i) => {
      const n = 5 + i;
      const arr = Array.from({ length: n }, (_, j) => (j * 13 + i * 5) % 100);
      const k = 1 + (i % 3);
      const sorted = [...arr].sort((a, b) => a - b);
      return { input: `${n} ${k}\n${arr.join(' ')}`, expectedOutput: String(sorted[k - 1]) };
    },
    cppSignature: 'int solve(int n, int k, vector<int>& a)',
    cppBody: '    nth_element(a.begin(), a.begin()+k-1, a.end()); return a[k-1];',
  }),
};

const TITLE_TO_ARCHETYPE = {
  'Sum of Array Elements': 'array_sum',
  'Reverse a String': 'reverse_string',
  'Find Maximum in Array': 'array_max',
  'Count Vowels in String': 'count_vowels',
  'Pair Sum Indices': 'two_sum',
  'Palindrome Check': 'palindrome_string',
  'Factorial of N': 'factorial',
  'Greatest Common Divisor': 'gcd',
  'Count Set Bits': 'count_bits',
  'Merge Two Sorted Arrays': 'array_sum',
  'Minimum of Array': 'array_min',
  'Second Largest Element': 'second_largest',
  'Remove Duplicates Sorted': 'remove_duplicates_sorted',
  'Rotate Array Left': 'rotate_left',
  'Check Prime Number': 'is_prime',
  'Sum of Digits': 'digit_sum',
  'Leap Year Check': 'leap_year',
  'Absolute Difference': 'abs_diff',
  'Swap Two Numbers': 'abs_diff',
  'Check Anagram': 'palindrome_string',
  'First Non-Repeating Character': 'distinct_count',
  'Longest Word in Sentence': 'count_vowels',
  'Intersection of Two Arrays': 'distinct_count',
  'Missing Number in Sequence': 'array_sum',
  'Move Zeros to End': 'rotate_left',
  'Valid Parentheses Simple': 'valid_parentheses',
  'Implement Stack using Array': 'array_max',
  'Queue using Two Stacks Concept': 'array_sum',
  'Binary Search Exists': 'binary_search',
  'Search Insert Position': 'binary_search',
  'Sqrt Integer Floor': 'array_max',
  'Power of Two Check': 'count_bits',
  'Hamming Distance Bits': 'count_bits',
  'XOR From 1 To N': 'range_sum',
  'Print Pascal Row': 'fibonacci',
  'Pythagorean Triplet Check': 'two_sum',
  'Smallest Missing Positive Easy': 'array_min',
  'Max Consecutive Ones': 'sliding_window_max_sum',
  'Ransom Note Construct': 'count_vowels',
  'Valid Mountain Array': 'array_max',
  'Find Pivot Index': 'array_sum',
  'Running Sum of Array': 'array_sum',
  'Shuffle Array Simulation': 'rotate_left',
  'Matrix Diagonal Sum': 'array_sum',
  'Transpose Matrix': 'rotate_left',
  'Spiral Matrix Direction': 'rotate_left',
  'Count Equal Pairs': 'distinct_count',
  'Longest Substring Without Repeat': 'distinct_count',
  'Container With Most Water': 'sliding_window_max_sum',
  'Three Sum Triplets': 'two_sum',
  'Group Anagrams': 'distinct_count',
  'Top K Frequent Elements': 'kth_smallest',
  'Product Except Self': 'array_sum',
  'Subarray Sum Equals K': 'sliding_window_max_sum',
  'Longest Increasing Subsequence': 'fibonacci',
  'Coin Change Minimum': 'coin_change',
  'House Robber Linear': 'sliding_window_max_sum',
  'Decode Ways Count': 'fibonacci',
  'Unique Paths Grid': 'fibonacci',
  'Minimum Path Sum Grid': 'sliding_window_max_sum',
  'Word Break Possible': 'coin_change',
  'LRU Cache Simulation': 'array_sum',
  'Evaluate Reverse Polish': 'valid_parentheses',
  'Daily Temperatures Next Greater': 'array_max',
  'Number of Islands': 'bfs_shortest_path',
  'Course Schedule Possible': 'bfs_shortest_path',
  'Clone Graph Nodes': 'bfs_shortest_path',
  'Kth Smallest in BST': 'kth_smallest',
  'Validate BST Property': 'binary_search',
  'Lowest Common Ancestor BST': 'binary_search',
  'Network Delay Time': 'bfs_shortest_path',
  'Cheapest Flights K Stops': 'bfs_shortest_path',
  'Rotting Oranges Minutes': 'bfs_shortest_path',
  'Word Ladder Length': 'bfs_shortest_path',
  'Pacific Atlantic Flow': 'bfs_shortest_path',
  'Surrounded Regions Capture': 'bfs_shortest_path',
  'Permutations Generate': 'factorial',
  'Combination Sum Ways': 'coin_change',
  'N Queens Count Mod': 'factorial',
  'Partition Equal Subset': 'coin_change',
  'Target Sum Assign Signs': 'coin_change',
  'Longest Palindromic Substring': 'palindrome_string',
  'Palindromic Substrings Count': 'palindrome_string',
  'Edit Distance Levenshtein': 'lcs_length',
  'Interleaving String Check': 'lcs_length',
  'Burst Balloons Max Coins': 'coin_change',
  'Maximum Subarray Divide Conquer': 'max_subarray_sum',
  'Median of Two Sorted Arrays': 'binary_search',
  'Regular Expression Matching': 'lcs_length',
  'Wildcard Pattern Match': 'lcs_length',
  'Longest Valid Parentheses': 'valid_parentheses',
  'Trapping Rain Water Hard': 'sliding_window_max_sum',
  'Minimum Window Substring Hard': 'sliding_window_max_sum',
  'Alien Dictionary Order': 'bfs_shortest_path',
  'Serialize Deserialize Tree': 'bfs_shortest_path',
  'Binary Tree Max Path Sum': 'max_subarray_sum',
  'Word Search II Trie': 'bfs_shortest_path',
  'Merge K Sorted Lists': 'kth_smallest',
  'Sliding Window Maximum deque': 'sliding_window_max_sum',
  'LFU Cache Operations': 'array_sum',
  'Design Twitter Feed': 'array_sum',
  'Max Points on Line': 'distinct_count',
  'Russian Doll Envelopes': 'binary_search',
  'Bus Routes Minimum Hops': 'bfs_shortest_path',
  'Swim in Rising Water': 'bfs_shortest_path',
  'Cut Off Trees Uniform': 'bfs_shortest_path',
  'Concatenated Words Trie': 'lcs_length',
};

const ARCHETYPE_ROTATION = [
  'array_sum', 'array_max', 'array_min', 'distinct_count', 'binary_search',
  'fibonacci', 'sliding_window_max_sum', 'two_sum', 'gcd', 'count_bits',
  'max_subarray_sum', 'coin_change', 'bfs_shortest_path', 'kth_smallest', 'lcs_length',
];

function resolveArchetype(title, index) {
  return TITLE_TO_ARCHETYPE[title] || ARCHETYPE_ROTATION[index % ARCHETYPE_ROTATION.length];
}

const ARCHETYPE_HINTS = {
  array_sum: [
    'Read all input values into an array or accumulate while reading.',
    'You only need a single pass over the elements.',
    'Maintain a running total variable and add each element to it.',
    'No special data structure is needed — iterate and sum.',
  ],
  array_min: [
    'Scan the entire array at least once.',
    'Track the best (smallest) value seen so far.',
    'Initialize your answer with the first element or a very large value.',
    'Compare each element with the current minimum and update if smaller.',
  ],
  array_max: [
    'Scan the entire array at least once.',
    'Track the largest value encountered.',
    'Initialize with the first element or a very small sentinel.',
    'Update the answer whenever you see a larger value.',
  ],
  second_largest: [
    'You need the two largest distinct values in the array.',
    'Sorting works but a single pass is more efficient.',
    'Track both the largest and second-largest while iterating.',
    'When updating the maximum, remember to update second-largest accordingly.',
  ],
  two_sum: [
    'For each value, think about what complement you need to reach the target.',
    'A brute-force double loop works for small N but can be optimized.',
    'Store previously seen values in a hash map with their indices.',
    'Check if (target - current) already exists in the map before inserting.',
  ],
  binary_search: [
    'The array is sorted — use that property.',
    'Maintain a search interval with left and right pointers.',
    'Compare the middle element with the target each step.',
    'Eliminate half the search space based on whether the middle is too small or too large.',
  ],
  sliding_window_max_sum: [
    'A window of fixed size K slides across the array.',
    'Recomputing the full window sum each time is slow for large N.',
    'Add the new element entering the window and remove the one leaving.',
    'Track the maximum window sum seen during the slide.',
  ],
  fibonacci: [
    'Each term is the sum of the two preceding terms.',
    'Recursion works but recomputes subproblems — consider iteration.',
    'Keep only the last two values while iterating from 2 to N.',
    'Use 64-bit integers if N can be moderately large.',
  ],
  coin_change: [
    'Think of this as finding the fewest coins to make an amount.',
    'Dynamic programming builds answers for smaller amounts first.',
    'For each coin, try using it to improve dp[amount].',
    'Initialize unreachable states with infinity except dp[0] = 0.',
  ],
  bfs_shortest_path: [
    'Model the graph with adjacency lists.',
    'BFS explores nodes level by level — ideal for unweighted shortest paths.',
    'Use a queue and a distance array initialized to -1 or infinity.',
    'Stop early if you reach the destination node.',
  ],
  valid_parentheses: [
    'Process characters from left to right.',
    'Opening brackets must be closed in the correct order.',
    'Use a stack to track unmatched opening brackets.',
    'On a closing bracket, check it matches the stack top before popping.',
  ],
  max_subarray_sum: [
    'Consider every contiguous subarray — brute force is O(N^2).',
    'Kadane\'s algorithm solves this in one pass.',
    'If extending the current subarray gives a smaller sum, start fresh at the current element.',
    'Track the global maximum subarray sum while iterating.',
  ],
  default: [
    'Carefully parse the input format described in the statement.',
    'Identify the core pattern: iteration, sorting, or dynamic programming.',
    'Consider edge cases: empty input, single element, duplicates, and boundary values.',
    'Verify your solution against all sample test cases before submitting.',
  ],
};

const DIFFICULTY_HINT_LEVELS = {
  EASY: { count: 2, start: 2 },
  MEDIUM: { count: 3, start: 1 },
  HARD: { count: 3, start: 0 },
};

function generateHints(difficulty, archetypeKey, tags) {
  const pool = ARCHETYPE_HINTS[archetypeKey] || ARCHETYPE_HINTS.default;
  const { count, start } = DIFFICULTY_HINT_LEVELS[difficulty] || DIFFICULTY_HINT_LEVELS.MEDIUM;
  const hints = pool.slice(start, start + count);

  if (hints.length < count) {
    hints.push(...ARCHETYPE_HINTS.default.slice(0, count - hints.length));
  }

  const primaryTag = tags[0] || 'this problem';
  return hints.map((h, i) => {
    if (i === 0 && difficulty === 'HARD') {
      return `This is a HARD problem on ${primaryTag}. ${h}`;
    }
    if (i === 0 && difficulty === 'EASY') {
      return `Starter tip: ${h}`;
    }
    return h;
  });
}

module.exports = { ARCHETYPES, TITLE_TO_ARCHETYPE, resolveArchetype, rangeCases, generateHints };
