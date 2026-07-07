#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { ARCHETYPES, resolveArchetype, generateHints } = require('./problem-bank');

const CPP_HEADER = `#include <bits/stdc++.h>\nusing namespace std;\n\n`;

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function isoNow(offsetDays = 0) {
  const d = new Date('2026-01-15T00:00:00.000Z');
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString();
}

const TOPIC_POOL = [
  ['Arrays', 'Prefix Sum'], ['Strings'], ['Hashing'], ['Linked List'], ['Stack'],
  ['Queue'], ['Trees'], ['Binary Search Trees'], ['Graphs', 'BFS'], ['Graphs', 'DFS'],
  ['Dynamic Programming'], ['Greedy'], ['Binary Search'], ['Sliding Window'],
  ['Two Pointers'], ['Heap'], ['Backtracking'], ['Recursion'], ['Bit Manipulation'], ['Math'],
];

const EASY_TITLES = [
  'Sum of Array Elements', 'Reverse a String', 'Find Maximum in Array', 'Count Vowels in String',
  'Pair Sum Indices', 'Palindrome Check', 'Factorial of N', 'Greatest Common Divisor', 'Count Set Bits',
  'Merge Two Sorted Arrays', 'Minimum of Array', 'Second Largest Element', 'Remove Duplicates Sorted',
  'Rotate Array Left', 'Check Prime Number', 'Sum of Digits', 'Leap Year Check', 'Absolute Difference',
  'Swap Two Numbers', 'Check Anagram', 'First Non-Repeating Character', 'Longest Word in Sentence',
  'Intersection of Two Arrays', 'Missing Number in Sequence', 'Move Zeros to End', 'Valid Parentheses Simple',
  'Implement Stack using Array', 'Queue using Two Stacks Concept', 'Binary Search Exists', 'Search Insert Position',
  'Sqrt Integer Floor', 'Power of Two Check', 'Hamming Distance Bits', 'XOR From 1 To N', 'Print Pascal Row',
  'Pythagorean Triplet Check', 'Smallest Missing Positive Easy', 'Max Consecutive Ones', 'Ransom Note Construct',
  'Valid Mountain Array',
];

const MEDIUM_TITLES = [
  'Find Pivot Index', 'Running Sum of Array', 'Shuffle Array Simulation', 'Matrix Diagonal Sum',
  'Transpose Matrix', 'Spiral Matrix Direction', 'Count Equal Pairs', 'Longest Substring Without Repeat',
  'Container With Most Water', 'Three Sum Triplets', 'Group Anagrams', 'Top K Frequent Elements',
  'Product Except Self', 'Subarray Sum Equals K', 'Longest Increasing Subsequence', 'Coin Change Minimum',
  'House Robber Linear', 'Decode Ways Count', 'Unique Paths Grid', 'Minimum Path Sum Grid', 'Word Break Possible',
  'LRU Cache Simulation', 'Evaluate Reverse Polish', 'Daily Temperatures Next Greater', 'Number of Islands',
  'Course Schedule Possible', 'Clone Graph Nodes', 'Kth Smallest in BST', 'Validate BST Property',
  'Lowest Common Ancestor BST', 'Network Delay Time', 'Cheapest Flights K Stops', 'Rotting Oranges Minutes',
  'Word Ladder Length', 'Pacific Atlantic Flow', 'Surrounded Regions Capture', 'Permutations Generate',
  'Combination Sum Ways', 'N Queens Count Mod', 'Partition Equal Subset',
];

const HARD_TITLES = [
  'Target Sum Assign Signs', 'Longest Palindromic Substring', 'Palindromic Substrings Count',
  'Edit Distance Levenshtein', 'Interleaving String Check', 'Burst Balloons Max Coins',
  'Maximum Subarray Divide Conquer', 'Median of Two Sorted Arrays', 'Regular Expression Matching',
  'Wildcard Pattern Match', 'Longest Valid Parentheses', 'Trapping Rain Water Hard',
  'Minimum Window Substring Hard', 'Alien Dictionary Order', 'Serialize Deserialize Tree',
  'Binary Tree Max Path Sum', 'Word Search II Trie', 'Merge K Sorted Lists',
  'Sliding Window Maximum deque', 'LFU Cache Operations',
];

function buildFromArchetype(title, difficulty, tags, archetypeKey, index) {
  const arch = ARCHETYPES[archetypeKey];
  if (!arch) throw new Error(`Unknown archetype: ${archetypeKey} for ${title}`);

  const starter = `${CPP_HEADER}${arch.cppSignature} {\n${arch.cppBody}\n}\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // Read input according to problem format, call solve(), print result\n    return 0;\n}`;

  return {
    title,
    slug: slugify(title),
    difficulty,
    tags,
    description: arch.description,
    constraints: arch.constraints,
    examples: arch.examples,
    hints: generateHints(difficulty, archetypeKey, tags),
    starterCode: { cpp: starter },
    visibleTestCases: arch.visibleTestCases,
    hiddenTestCases: arch.hiddenTestCases,
    timeLimit: difficulty === 'HARD' ? 2000 : difficulty === 'MEDIUM' ? 1500 : 1000,
    memoryLimit: difficulty === 'HARD' ? 500 : 256,
    createdAt: isoNow(index),
    updatedAt: isoNow(index),
  };
}

function buildAll() {
  const problems = [];
  let index = 0;

  for (const title of EASY_TITLES) {
    problems.push(buildFromArchetype(title, 'EASY', TOPIC_POOL[index % TOPIC_POOL.length], resolveArchetype(title, index), index++));
  }
  for (const title of MEDIUM_TITLES) {
    problems.push(buildFromArchetype(title, 'MEDIUM', TOPIC_POOL[index % TOPIC_POOL.length], resolveArchetype(title, index), index++));
  }
  for (const title of HARD_TITLES) {
    problems.push(buildFromArchetype(title, 'HARD', TOPIC_POOL[index % TOPIC_POOL.length], resolveArchetype(title, index), index++));
  }

  return problems;
}

const problems = buildAll();

const slugs = new Set();
for (const p of problems) {
  if (slugs.has(p.slug)) throw new Error('Duplicate slug: ' + p.slug);
  slugs.add(p.slug);
  if (p.examples.length < 3) throw new Error('Need 3 examples: ' + p.title);
  if (p.visibleTestCases.length < 3) throw new Error('Need 3 visible: ' + p.title);
  if (p.hiddenTestCases.length < 15) throw new Error('Need 15 hidden: ' + p.title);
  if (!p.starterCode.cpp) throw new Error('Need cpp: ' + p.title);
}

if (problems.length !== 100) throw new Error('Expected 100 problems, got ' + problems.length);

const counts = { EASY: 0, MEDIUM: 0, HARD: 0 };
problems.forEach((p) => counts[p.difficulty]++);

const outPath = path.join(__dirname, '..', 'data', 'problems-dataset.json');
const manifestPath = path.join(__dirname, '..', 'data', 'problems-manifest.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ problems }, null, 2));

const byDifficulty = { EASY: [], MEDIUM: [], HARD: [] };
for (const p of problems) {
  byDifficulty[p.difficulty].push({ slug: p.slug, title: p.title });
}

const manifest = {
  total: problems.length,
  distribution: counts,
  sampleSlugs: {
    EASY: byDifficulty.EASY[0]?.slug,
    MEDIUM: byDifficulty.MEDIUM[0]?.slug,
    HARD: byDifficulty.HARD[0]?.slug,
  },
  byDifficulty,
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

process.stdout.write(JSON.stringify({ problems: problems.length, distribution: counts, file: outPath }));
