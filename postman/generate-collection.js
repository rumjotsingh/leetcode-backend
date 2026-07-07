const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '..', 'data', 'problems-manifest.json');
const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  : { sampleSlugs: { EASY: 'sum-of-array-elements', MEDIUM: 'find-pivot-index', HARD: 'target-sum-assign-signs' } };

const CPP_SUM_ARRAY = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        int x;
        cin >> x;
        sum += x;
    }
    cout << sum;
    return 0;
}`;

const saveTokensTest = `
if (pm.response.code === 200 || pm.response.code === 201) {
  const json = pm.response.json();
  if (json.data?.accessToken) pm.collectionVariables.set('accessToken', json.data.accessToken);
  if (json.data?.refreshToken) pm.collectionVariables.set('refreshToken', json.data.refreshToken);
  if (json.data?.user?.id) pm.collectionVariables.set('userId', json.data.user.id);
}
`.trim();

const saveProblemFromListTest = `
if (pm.response.code === 200) {
  const problems = pm.response.json().data?.problems;
  if (problems?.[0]?.id) pm.collectionVariables.set('problemId', problems[0].id);
  if (problems?.[0]?.slug) pm.collectionVariables.set('problemSlug', problems[0].slug);
}
`.trim();

const saveProblemIdTest = `
if (pm.response.code === 201) {
  const json = pm.response.json();
  if (json.data?.id) pm.collectionVariables.set('problemId', json.data.id);
  if (json.data?.slug) pm.collectionVariables.set('problemSlug', json.data.slug);
}
`.trim();

const saveSubmissionIdTest = `
if (pm.response.code === 201) {
  const json = pm.response.json();
  if (json.data?.id) pm.collectionVariables.set('submissionId', json.data.id);
}
`.trim();

const saveTagIdTest = `
if (pm.response.code === 201) {
  const json = pm.response.json();
  if (json.data?.id) pm.collectionVariables.set('tagId', json.data.id);
}
`.trim();

const commonSuccessTests = `
pm.test('Status code is successful', function () {
  pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});
pm.test('Response has success true', function () {
  pm.expect(pm.response.json().success).to.eql(true);
});
`.trim();

function bearerAuth() {
  return { type: 'bearer', bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }] };
}

function noAuth() {
  return { type: 'noauth' };
}

function jsonBody(raw) {
  return { mode: 'raw', raw: JSON.stringify(raw, null, 2), options: { raw: { language: 'json' } } };
}

function headers(extra = []) {
  return [{ key: 'Content-Type', value: 'application/json' }, ...extra];
}

function response(name, status, body, code = status) {
  return {
    name,
    originalRequest: { method: 'GET', header: [], url: '{{baseUrl}}' },
    status: name.split(' ')[0],
    code,
    _postman_previewlanguage: 'json',
    header: [{ key: 'Content-Type', value: 'application/json' }],
    cookie: [],
    body: JSON.stringify(body, null, 2),
  };
};

function req({ name, method, url, description, body, auth, tests, preRequest, examples = [] }) {
  const item = {
    name,
    request: {
      method,
      header: headers(),
      body: body ? jsonBody(body) : undefined,
      url,
      description,
      auth: auth ?? bearerAuth(),
    },
    response: examples,
  };
  const events = [];
  if (preRequest) events.push({ listen: 'prerequest', script: { type: 'text/javascript', exec: preRequest.split('\n') } });
  if (tests) events.push({ listen: 'test', script: { type: 'text/javascript', exec: tests.split('\n') } });
  if (events.length) item.event = events;
  return item;
}

const errorExamples = {
  400: (msg = 'Validation error', errors) => response('400 Bad Request', 'Bad Request', { success: false, message: msg, ...(errors ? { errors } : {}) }, 400),
  401: (msg = 'Unauthorized') => response('401 Unauthorized', 'Unauthorized', { success: false, message: msg }, 401),
  403: (msg = 'Forbidden') => response('403 Forbidden', 'Forbidden', { success: false, message: msg }, 403),
  404: (msg = 'Resource not found') => response('404 Not Found', 'Not Found', { success: false, message: msg }, 404),
  409: (msg = 'Conflict') => response('409 Conflict', 'Conflict', { success: false, message: msg }, 409),
  422: (msg = 'Unprocessable Entity', errors) => response('422 Unprocessable Entity', 'Unprocessable Entity', { success: false, message: msg, ...(errors ? { errors } : {}) }, 422),
  500: (msg = 'Internal server error') => response('500 Internal Server Error', 'Internal Server Error', { success: false, message: msg }, 500),
};

const collection = {
  info: {
    name: 'CodeArena API',
    _postman_id: 'codearena-api-v1',
    description: `# CodeArena API Collection

Production-ready Postman collection for the **CodeArena** LeetCode-style backend.

## Setup
1. Import this collection into Postman.
2. Set collection variables (defaults provided).
3. Run **Register** or **Login** — \`accessToken\` and \`refreshToken\` are saved automatically.
4. Use protected endpoints — Bearer auth uses \`{{accessToken}}\`.

## Base URL
Default: \`http://localhost:3000/api\`

## Problem identifiers
Use **MongoDB ObjectId** or **slug** for \`problemId\` (e.g. \`sum-of-array-elements\`).
Default slugs from dataset: EASY=\`${manifest.sampleSlugs.EASY}\`, MEDIUM=\`${manifest.sampleSlugs.MEDIUM}\`, HARD=\`${manifest.sampleSlugs.HARD}\`

## Code execution (C++ only)
- **Language:** C++ only — Judge0 \`language_id: 54\` (GCC 9.4.0)
- **Run** (\`POST /submissions/run\`) — judges **visible test cases only** (sync)
- **Submit** (\`POST /submissions\`) — judges **all test cases** via Redis worker (async)
- Execution service: CodeBox / Judge0 at \`EXECUTION_API_URL\` with \`X-Auth-Token\`
- Submit a **complete C++ program** with \`main()\` that reads stdin and prints stdout

## Recommended test flow
1. **Login** → saves tokens
2. **Get All Problems** → saves \`problemId\` + \`problemSlug\`
3. **Get Problem By Slug** → view hints + starter code
4. **Run Code** → test against public cases
5. **Submit Code** → full judge (start \`npm run dev:worker\`)
6. **Get Submission** → poll until not PENDING/RUNNING

## Auth Flow
1. \`POST /auth/register\` or \`POST /auth/login\`
2. Tokens saved to collection variables via test scripts
3. Protected routes use \`Authorization: Bearer {{accessToken}}\`

## Roles
- \`USER\` — submit code, view problems, profile
- \`ADMIN\` — manage problems and tags

## Response Format
\`\`\`json
{ "success": true, "data": { ... } }
\`\`\`

## Error Format
\`\`\`json
{ "success": false, "message": "Error description" }
\`\`\`
Validation errors (400) include an \`errors\` array with \`field\` and \`message\`.`,
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  auth: bearerAuth(),
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3000/api', type: 'string' },
    { key: 'accessToken', value: '', type: 'string' },
    { key: 'refreshToken', value: '', type: 'string' },
    { key: 'problemId', value: '', type: 'string' },
    { key: 'problemSlug', value: manifest.sampleSlugs.EASY, type: 'string' },
    { key: 'easyProblemSlug', value: manifest.sampleSlugs.EASY, type: 'string' },
    { key: 'mediumProblemSlug', value: manifest.sampleSlugs.MEDIUM, type: 'string' },
    { key: 'hardProblemSlug', value: manifest.sampleSlugs.HARD, type: 'string' },
    { key: 'submissionId', value: '', type: 'string' },
    { key: 'userId', value: '', type: 'string' },
    { key: 'tagId', value: '', type: 'string' },
    { key: 'username', value: 'codearena_user', type: 'string' },
  ],
  item: [
    {
      name: '1. Authentication',
      description: 'User registration, login, token refresh, and session management.',
      item: [
        req({
          name: 'Register',
          method: 'POST',
          url: '{{baseUrl}}/auth/register',
          auth: noAuth(),
          description: 'Register a new user account. Returns user object, access token, and refresh token.\n\n**Validation:**\n- username: 3-30 chars, alphanumeric + underscore\n- email: valid email\n- password: min 8 chars',
          body: { username: '{{username}}', email: 'user@codearena.dev', password: 'SecurePass123!' },
          tests: [commonSuccessTests, saveTokensTest].join('\n'),
          examples: [
            response('201 Created', 'Created', {
              success: true,
              data: {
                user: { id: '665a1b2c3d4e5f6789012340', username: 'codearena_user', email: 'user@codearena.dev', avatar: '', role: 'USER', totalSolved: 0, createdAt: '2026-07-07T12:00:00.000Z' },
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                refreshToken: 'a1b2c3d4e5f678901234567890abcdef...',
              },
            }, 201),
            errorExamples[400]('Validation error', [{ field: 'password', message: 'Password must be at least 8 characters' }]),
            errorExamples[409]('Email already registered'),
          ],
        }),
        req({
          name: 'Login',
          method: 'POST',
          url: '{{baseUrl}}/auth/login',
          auth: noAuth(),
          description: 'Authenticate with email and password. Automatically saves `accessToken` and `refreshToken` to collection variables.',
          body: { email: 'user@codearena.dev', password: 'SecurePass123!' },
          tests: [commonSuccessTests, saveTokensTest].join('\n'),
          examples: [
            response('200 OK', 'OK', {
              success: true,
              data: {
                user: { id: '665a1b2c3d4e5f6789012340', username: 'codearena_user', email: 'user@codearena.dev', avatar: '', role: 'USER', totalSolved: 5, createdAt: '2026-07-07T12:00:00.000Z' },
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                refreshToken: 'a1b2c3d4e5f678901234567890abcdef...',
              },
            }),
            errorExamples[401]('Invalid email or password'),
            errorExamples[400]('Validation error', [{ field: 'email', message: 'Invalid email address' }]),
          ],
        }),
        req({
          name: 'Logout',
          method: 'POST',
          url: '{{baseUrl}}/auth/logout',
          auth: noAuth(),
          description: 'Invalidate the refresh token. Pass the refresh token in the request body.',
          body: { refreshToken: '{{refreshToken}}' },
          tests: commonSuccessTests,
          examples: [
            response('200 OK', 'OK', { success: true, message: 'Logged out successfully' }),
            errorExamples[400]('Validation error', [{ field: 'refreshToken', message: 'Refresh token is required' }]),
          ],
        }),
        req({
          name: 'Refresh Token',
          method: 'POST',
          url: '{{baseUrl}}/auth/refresh',
          auth: noAuth(),
          description: 'Exchange a valid refresh token for a new access/refresh token pair. Old refresh token is revoked.',
          body: { refreshToken: '{{refreshToken}}' },
          tests: [commonSuccessTests, saveTokensTest].join('\n'),
          examples: [
            response('200 OK', 'OK', {
              success: true,
              data: {
                user: { id: '665a1b2c3d4e5f6789012340', username: 'codearena_user', email: 'user@codearena.dev', avatar: '', role: 'USER', totalSolved: 5, createdAt: '2026-07-07T12:00:00.000Z' },
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new...',
                refreshToken: 'new_refresh_token_value...',
              },
            }),
            errorExamples[401]('Invalid or expired refresh token'),
          ],
        }),
        req({
          name: 'Get Current User',
          method: 'GET',
          url: '{{baseUrl}}/auth/me',
          description: 'Get the authenticated user profile. Requires valid Bearer access token.',
          tests: [commonSuccessTests, `if (pm.response.json().data?.id) pm.collectionVariables.set('userId', pm.response.json().data.id);`].join('\n'),
          examples: [
            response('200 OK', 'OK', {
              success: true,
              data: { id: '665a1b2c3d4e5f6789012340', username: 'codearena_user', email: 'user@codearena.dev', avatar: '', role: 'USER', totalSolved: 5, createdAt: '2026-07-07T12:00:00.000Z' },
            }),
            errorExamples[401]('Invalid or expired access token'),
          ],
        }),
      ],
    },
    {
      name: '2. Users',
      description: 'User profile and account management.',
      item: [
        req({
          name: 'Get User Profile',
          method: 'GET',
          url: '{{baseUrl}}/users/{{username}}',
          auth: noAuth(),
          description: 'Get public user profile with solve statistics and recent submissions.',
          tests: commonSuccessTests,
          examples: [
            response('200 OK', 'OK', {
              success: true,
              data: {
                username: 'codearena_user',
                avatar: 'https://avatars.codearena.dev/u/codearena_user.png',
                totalSolved: 42,
                easySolved: 20,
                mediumSolved: 15,
                hardSolved: 7,
                recentSubmissions: [
                  { id: '665a1b2c3d4e5f6789012346', status: 'ACCEPTED', language: 'cpp', runtime: 68, memory: 42000, createdAt: '2026-07-07T14:30:00.000Z', problem: { id: '665a1b2c3d4e5f6789012345', title: 'Sum of Array Elements', slug: 'sum-of-array-elements' } },
                ],
              },
            }),
            errorExamples[404]('User not found'),
          ],
        }),
        req({
          name: 'Update Profile',
          method: 'PATCH',
          url: '{{baseUrl}}/users/me',
          description: '**Planned endpoint** — Update authenticated user profile (avatar, username).\n\n> Not yet implemented in MVP. Included as API contract reference.',
          body: { avatar: 'https://avatars.codearena.dev/u/codearena_user.png', username: 'new_username' },
          tests: commonSuccessTests,
          examples: [
            response('200 OK', 'OK', { success: true, data: { id: '{{userId}}', username: 'new_username', avatar: 'https://avatars.codearena.dev/u/new_username.png', email: 'user@codearena.dev', role: 'USER' } }),
            errorExamples[401]('Unauthorized'),
            errorExamples[409]('Username already taken'),
            errorExamples[422]('Validation failed', [{ field: 'username', message: 'Username must be 3-30 characters' }]),
          ],
        }),
        req({
          name: 'Change Password',
          method: 'POST',
          url: '{{baseUrl}}/users/me/change-password',
          description: '**Planned endpoint** — Change password for authenticated user.\n\n> Not yet implemented in MVP. Included as API contract reference.',
          body: { currentPassword: 'SecurePass123!', newPassword: 'NewSecurePass456!' },
          tests: commonSuccessTests,
          examples: [
            response('200 OK', 'OK', { success: true, message: 'Password updated successfully' }),
            errorExamples[401]('Current password is incorrect'),
            errorExamples[400]('Validation error', [{ field: 'newPassword', message: 'Password must be at least 8 characters' }]),
          ],
        }),
      ],
    },
    {
      name: '3. Problems',
      description: 'Problem discovery, search, filtering, and admin management.',
      item: [
        req({
          name: 'Get All Problems',
          method: 'GET',
          url: '{{baseUrl}}/problems?page=1&limit=20',
          auth: noAuth(),
          description: 'List all problems with pagination. Pass Bearer token optionally to include solved status.\n\n**Auto-saves** `problemId` and `problemSlug` from the first result.',
          tests: [commonSuccessTests, saveProblemFromListTest].join('\n'),
          examples: [
            response('200 OK', 'OK', {
              success: true,
              data: {
                problems: [{ id: '6a4d1029aa8c1384b2a447a9', title: 'Sum of Array Elements', slug: 'sum-of-array-elements', difficulty: 'EASY', tags: ['Arrays', 'Prefix Sum'], solved: false }],
                pagination: { page: 1, limit: 20, total: 100, totalPages: 5 },
              },
            }),
          ],
        }),
        req({
          name: 'Get Problem By Slug',
          method: 'GET',
          url: '{{baseUrl}}/problems/{{problemSlug}}',
          auth: noAuth(),
          description: 'Get problem by **slug** (recommended). Returns description, examples, hints, C++ starter code, time/memory limits.\n\nTest cases are only returned for ADMIN users.',
          tests: [commonSuccessTests, `const d=pm.response.json().data; if(d?.id) pm.collectionVariables.set('problemId', d.id); if(d?.slug) pm.collectionVariables.set('problemSlug', d.slug);`].join('\n'),
          examples: [
            response('200 OK', 'OK', {
              success: true,
              data: {
                id: '6a4d1029aa8c1384b2a447a9',
                title: 'Sum of Array Elements',
                slug: 'sum-of-array-elements',
                description: 'Given an integer array of size N, compute the sum of all elements.',
                difficulty: 'EASY',
                tags: ['Arrays', 'Prefix Sum'],
                constraints: '1 <= N <= 10^5',
                hints: ['Starter tip: Maintain a running total variable and add each element to it.', 'No special data structure is needed — iterate and sum.'],
                examples: [{ input: '3\\n1 2 3', output: '6', explanation: '1+2+3=6.' }],
                starterCode: { javascript: '', python: '', cpp: '#include <bits/stdc++.h>\\n...', java: '' },
                timeLimit: 1000,
                memoryLimit: 256,
                createdAt: '2026-01-15T00:00:00.000Z',
                updatedAt: '2026-01-15T00:00:00.000Z',
              },
            }),
            errorExamples[404]('Problem not found'),
          ],
        }),
        req({
          name: 'Get Problem By ID',
          method: 'GET',
          url: '{{baseUrl}}/problems/{{problemId}}',
          auth: noAuth(),
          description: 'Get problem by MongoDB ObjectId. Also accepts slug if passed in `problemId` variable.',
          tests: [commonSuccessTests, `const d=pm.response.json().data; if(d?.id) pm.collectionVariables.set('problemId', d.id); if(d?.slug) pm.collectionVariables.set('problemSlug', d.slug);`].join('\n'),
          examples: [
            response('200 OK', 'OK', {
              success: true,
              data: {
                id: '6a4d1029aa8c1384b2a447a9',
                title: 'Sum of Array Elements',
                slug: 'sum-of-array-elements',
                description: 'Given an integer array of size N, compute the sum of all elements.',
                difficulty: 'EASY',
                tags: ['Arrays', 'Prefix Sum'],
                constraints: '1 <= N <= 10^5',
                hints: ['Starter tip: Maintain a running total variable and add each element to it.'],
                examples: [{ input: '3\\n1 2 3', output: '6', explanation: '1+2+3=6.' }],
                starterCode: { javascript: '', python: '', cpp: '#include <bits/stdc++.h>\\n...', java: '' },
                timeLimit: 1000,
                memoryLimit: 256,
                createdAt: '2026-01-15T00:00:00.000Z',
                updatedAt: '2026-01-15T00:00:00.000Z',
              },
            }),
            errorExamples[404]('Problem not found'),
          ],
        }),
        req({
          name: 'Get Easy Problem',
          method: 'GET',
          url: '{{baseUrl}}/problems/{{easyProblemSlug}}',
          auth: noAuth(),
          description: `Get sample EASY problem from dataset (\`${manifest.sampleSlugs.EASY}\`).`,
          tests: [commonSuccessTests, `const d=pm.response.json().data; if(d?.id) pm.collectionVariables.set('problemId', d.id); if(d?.slug) pm.collectionVariables.set('problemSlug', d.slug);`].join('\n'),
          examples: [response('200 OK', 'OK', { success: true, data: { slug: manifest.sampleSlugs.EASY, difficulty: 'EASY', hints: [] } })],
        }),
        req({
          name: 'Get Medium Problem',
          method: 'GET',
          url: '{{baseUrl}}/problems/{{mediumProblemSlug}}',
          auth: noAuth(),
          description: `Get sample MEDIUM problem (\`${manifest.sampleSlugs.MEDIUM}\`).`,
          tests: commonSuccessTests,
          examples: [response('200 OK', 'OK', { success: true, data: { slug: manifest.sampleSlugs.MEDIUM, difficulty: 'MEDIUM' } })],
        }),
        req({
          name: 'Get Hard Problem',
          method: 'GET',
          url: '{{baseUrl}}/problems/{{hardProblemSlug}}',
          auth: noAuth(),
          description: `Get sample HARD problem (\`${manifest.sampleSlugs.HARD}\`).`,
          tests: commonSuccessTests,
          examples: [response('200 OK', 'OK', { success: true, data: { slug: manifest.sampleSlugs.HARD, difficulty: 'HARD' } })],
        }),
        req({
          name: 'Search Problems',
          method: 'GET',
          url: '{{baseUrl}}/problems?search=two+sum&page=1&limit=20',
          auth: noAuth(),
          description: 'Full-text search across problem titles and descriptions.',
          tests: commonSuccessTests,
          examples: [response('200 OK', 'OK', { success: true, data: { problems: [{ id: '665a1b2c3d4e5f6789012345', title: 'Two Sum', slug: 'two-sum', difficulty: 'EASY', tags: ['Array', 'Hash Table'], solved: false }], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } } })],
        }),
        req({
          name: 'Filter By Difficulty',
          method: 'GET',
          url: '{{baseUrl}}/problems?difficulty=MEDIUM&page=1&limit=20',
          auth: noAuth(),
          description: 'Filter problems by difficulty: `EASY`, `MEDIUM`, or `HARD`.',
          tests: commonSuccessTests,
          examples: [response('200 OK', 'OK', { success: true, data: { problems: [{ id: '665a1b2c3d4e5f6789012347', title: 'Add Two Numbers', slug: 'add-two-numbers', difficulty: 'MEDIUM', tags: ['Linked List', 'Math'], solved: false }], pagination: { page: 1, limit: 20, total: 45, totalPages: 3 } } })],
        }),
        req({
          name: 'Filter By Tags',
          method: 'GET',
          url: '{{baseUrl}}/problems?tag=dp&page=1&limit=20',
          auth: noAuth(),
          description: 'Filter problems by tag (case-insensitive partial match). E.g. `dp` matches `Dynamic Programming`.',
          tests: commonSuccessTests,
          examples: [response('200 OK', 'OK', { success: true, data: { problems: [{ id: '665a1b2c3d4e5f6789012348', title: 'Climbing Stairs', slug: 'climbing-stairs', difficulty: 'EASY', tags: ['Dynamic Programming'], solved: true }], pagination: { page: 1, limit: 20, total: 30, totalPages: 2 } } })],
        }),
        req({
          name: 'Filter By Status',
          method: 'GET',
          url: '{{baseUrl}}/problems?status=solved&page=1&limit=20',
          auth: bearerAuth(),
          description: 'Filter by solve status: `solved` or `unsolved`. **Requires authentication** to determine user solve state.',
          tests: commonSuccessTests,
          examples: [response('200 OK', 'OK', { success: true, data: { problems: [{ id: '665a1b2c3d4e5f6789012345', title: 'Two Sum', slug: 'two-sum', difficulty: 'EASY', tags: ['Array', 'Hash Table'], solved: true }], pagination: { page: 1, limit: 20, total: 42, totalPages: 3 } } })],
        }),
        req({
          name: 'Create Problem (Admin)',
          method: 'POST',
          url: '{{baseUrl}}/problems',
          description: 'Create a new problem. **Requires ADMIN role.** Saves returned `problemId` to collection variables.',
          body: {
            title: 'Two Sum',
            description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
            difficulty: 'EASY',
            tags: ['Array', 'Hash Table'],
            constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9',
            examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9' }],
            starterCode: {
              javascript: '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};',
              python: 'class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass',
              cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};',
              java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}',
            },
            testCases: [
              { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]' },
              { input: '[3,2,4]\n6', expectedOutput: '[1,2]' },
            ],
          },
          tests: [commonSuccessTests, saveProblemIdTest].join('\n'),
          examples: [
            response('201 Created', 'Created', { success: true, data: { id: '665a1b2c3d4e5f6789012345', title: 'Two Sum', slug: 'two-sum', difficulty: 'EASY', tags: ['Array', 'Hash Table'], constraints: '2 <= nums.length <= 10^4', examples: [], starterCode: {}, createdAt: '2026-07-07T12:00:00.000Z', updatedAt: '2026-07-07T12:00:00.000Z' } }, 201),
            errorExamples[403]('Insufficient permissions'),
            errorExamples[400]('Validation error', [{ field: 'testCases', message: 'At least one test case is required' }]),
            errorExamples[409]('A problem with a similar title already exists'),
          ],
        }),
        req({
          name: 'Update Problem (Admin)',
          method: 'PUT',
          url: '{{baseUrl}}/problems/{{problemId}}',
          description: 'Update an existing problem. **Requires ADMIN role.** All fields are optional.',
          body: { difficulty: 'MEDIUM', tags: ['Array', 'Hash Table', 'Sorting'] },
          tests: commonSuccessTests,
          examples: [
            response('200 OK', 'OK', { success: true, data: { id: '665a1b2c3d4e5f6789012345', title: 'Two Sum', slug: 'two-sum', difficulty: 'MEDIUM', tags: ['Array', 'Hash Table', 'Sorting'] } }),
            errorExamples[403]('Insufficient permissions'),
            errorExamples[404]('Problem not found'),
          ],
        }),
        req({
          name: 'Delete Problem (Admin)',
          method: 'DELETE',
          url: '{{baseUrl}}/problems/{{problemId}}',
          description: 'Delete a problem permanently. **Requires ADMIN role.**',
          tests: `pm.test('Status code is 200', () => pm.response.to.have.status(200));`,
          examples: [
            response('200 OK', 'OK', { success: true, message: 'Problem deleted successfully' }),
            errorExamples[403]('Insufficient permissions'),
            errorExamples[404]('Problem not found'),
          ],
        }),
      ],
    },
    {
      name: '4. Tags',
      description: 'Problem tag management. GET is implemented; CRUD endpoints are planned.',
      item: [
        req({
          name: 'Get All Tags',
          method: 'GET',
          url: '{{baseUrl}}/tags',
          auth: noAuth(),
          description: 'List all available problem tags. Tags are seeded on server startup.',
          tests: [commonSuccessTests, `const tags = pm.response.json().data; if (tags?.[0]?.id) pm.collectionVariables.set('tagId', tags[0].id);`].join('\n'),
          examples: [
            response('200 OK', 'OK', {
              success: true,
              data: [
                { id: '665a1b2c3d4e5f6789012350', name: 'Array', slug: 'array' },
                { id: '665a1b2c3d4e5f6789012351', name: 'Dynamic Programming', slug: 'dynamic-programming' },
              ],
            }),
          ],
        }),
        req({
          name: 'Create Tag',
          method: 'POST',
          url: '{{baseUrl}}/tags',
          description: '**Planned endpoint** — Create a new tag. **Requires ADMIN role.**\n\n> Not yet implemented in MVP.',
          body: { name: 'Backtracking' },
          tests: [commonSuccessTests, saveTagIdTest].join('\n'),
          examples: [
            response('201 Created', 'Created', { success: true, data: { id: '665a1b2c3d4e5f6789012352', name: 'Backtracking', slug: 'backtracking' } }, 201),
            errorExamples[403]('Insufficient permissions'),
            errorExamples[409]('Tag already exists'),
          ],
        }),
        req({
          name: 'Update Tag',
          method: 'PUT',
          url: '{{baseUrl}}/tags/{{tagId}}',
          description: '**Planned endpoint** — Update tag name. **Requires ADMIN role.**\n\n> Not yet implemented in MVP.',
          body: { name: 'Backtracking & Recursion' },
          tests: commonSuccessTests,
          examples: [
            response('200 OK', 'OK', { success: true, data: { id: '{{tagId}}', name: 'Backtracking & Recursion', slug: 'backtracking-recursion' } }),
            errorExamples[404]('Tag not found'),
            errorExamples[403]('Insufficient permissions'),
          ],
        }),
        req({
          name: 'Delete Tag',
          method: 'DELETE',
          url: '{{baseUrl}}/tags/{{tagId}}',
          description: '**Planned endpoint** — Delete a tag. **Requires ADMIN role.**\n\n> Not yet implemented in MVP.',
          tests: `pm.test('Status code is 200', () => pm.response.to.have.status(200));`,
          examples: [
            response('200 OK', 'OK', { success: true, message: 'Tag deleted successfully' }),
            errorExamples[404]('Tag not found'),
            errorExamples[403]('Insufficient permissions'),
          ],
        }),
      ],
    },
    {
      name: '5. Submissions',
      description: 'C++ code execution via CodeBox (Judge0). **Run** = visible test cases (sync). **Submit** = all test cases (async worker).',
      item: [
        req({
          name: 'Run Code (Public Test Cases)',
          method: 'POST',
          url: '{{baseUrl}}/submissions/run',
          description: 'Run C++ code against **visible test cases only** (sync). For Monaco editor "Run" button.\n\n- Uses Judge0 `POST /submissions?wait=true` with `expected_output`\n- Language: C++ only (`language_id: 54`)\n- `problemId` accepts ObjectId or slug\n- Code must be a complete program with `main()`',
          body: {
            problemId: '{{problemSlug}}',
            language: 'cpp',
            code: CPP_SUM_ARRAY,
          },
          tests: commonSuccessTests,
          examples: [
            response('200 OK', 'OK', {
              success: true,
              data: {
                mode: 'run',
                language: 'cpp',
                languageId: 54,
                status: 'ACCEPTED',
                passedCount: 3,
                totalCount: 3,
                runtime: 12,
                memory: 3200,
                testResults: [{ input: '3\\n1 2 3', expectedOutput: '6', actualOutput: '6', passed: true, runtime: 10, memory: 3000, status: 'Accepted', isPublic: true }],
              },
            }),
            errorExamples[401]('Access token required'),
            errorExamples[404]('Problem not found'),
          ],
        }),
        req({
          name: 'Submit Code (All Test Cases)',
          method: 'POST',
          url: '{{baseUrl}}/submissions',
          description: 'Submit C++ for **full judging** (visible + hidden test cases). Async via Redis worker — poll **Get Submission**.\n\nRequires `npm run dev:worker` running.',
          body: {
            problemId: '{{problemSlug}}',
            language: 'cpp',
            code: CPP_SUM_ARRAY,
          },
          tests: [commonSuccessTests, saveSubmissionIdTest].join('\n'),
          examples: [
            response('201 Created', 'Created', { success: true, data: { id: '665a1b2c3d4e5f6789012346', status: 'PENDING', language: 'cpp', languageId: 54, createdAt: '2026-07-07T14:30:00.000Z' } }, 201),
            errorExamples[401]('Access token required'),
            errorExamples[404]('Problem not found'),
          ],
        }),
        req({
          name: 'Get Submission',
          method: 'GET',
          url: '{{baseUrl}}/submissions/{{submissionId}}',
          description: 'Get submission details including test results. Users can only view their own submissions (ADMIN can view all).',
          tests: commonSuccessTests,
          examples: [
            response('200 OK', 'OK', {
              success: true,
              data: {
                id: '665a1b2c3d4e5f6789012346',
                status: 'ACCEPTED',
                language: 'cpp',
                sourceCode: CPP_SUM_ARRAY,
                runtime: 68,
                memory: 42000,
                testResults: [{ input: '3\\n1 2 3', expectedOutput: '6', actualOutput: '6', passed: true, runtime: 34, memory: 21000 }],
                createdAt: '2026-07-07T14:30:00.000Z',
                problem: { id: '6a4d1029aa8c1384b2a447a9', title: 'Sum of Array Elements', slug: 'sum-of-array-elements', difficulty: 'EASY' },
              },
            }),
            errorExamples[403]('You can only view your own submissions'),
            errorExamples[404]('Submission not found'),
          ],
        }),
        req({
          name: 'Get Submission History',
          method: 'GET',
          url: '{{baseUrl}}/submissions/history?page=1&limit=20',
          description: 'Paginated submission history for the authenticated user. Filter by `status` and `problemId`.',
          tests: commonSuccessTests,
          examples: [
            response('200 OK', 'OK', {
              success: true,
              data: {
                submissions: [{ id: '665a1b2c3d4e5f6789012346', status: 'ACCEPTED', language: 'cpp', sourceCode: '...', runtime: 68, memory: 42000, testResults: [], createdAt: '2026-07-07T14:30:00.000Z', problem: { id: '6a4d1029aa8c1384b2a447a9', title: 'Sum of Array Elements', slug: 'sum-of-array-elements', difficulty: 'EASY' } }],
                pagination: { page: 1, limit: 20, total: 55, totalPages: 3 },
              },
            }),
            errorExamples[401]('Access token required'),
          ],
        }),
        req({
          name: 'Get Latest Submission',
          method: 'GET',
          url: '{{baseUrl}}/submissions/history?problemId={{problemSlug}}&limit=1',
          description: 'Get the most recent submission for a problem. Uses history endpoint with `limit=1` filter.\n\nPoll **Get Submission** after submit until status is not PENDING/RUNNING.',
          tests: commonSuccessTests,
          examples: [
            response('200 OK', 'OK', {
              success: true,
              data: {
                submissions: [{ id: '665a1b2c3d4e5f6789012346', status: 'ACCEPTED', language: 'cpp', runtime: 68, memory: 42000, createdAt: '2026-07-07T14:30:00.000Z', problem: { id: '6a4d1029aa8c1384b2a447a9', title: 'Sum of Array Elements', slug: 'sum-of-array-elements', difficulty: 'EASY' } }],
                pagination: { page: 1, limit: 1, total: 12, totalPages: 12 },
              },
            }),
          ],
        }),
      ],
    },
    {
      name: '6. Health',
      description: 'Service health check (no /api prefix).',
      item: [
        req({
          name: 'Health Check',
          method: 'GET',
          url: 'http://localhost:3000/health',
          auth: noAuth(),
          description: 'Check if the API server is running. Uses root URL (not `baseUrl`).',
          tests: `pm.test('Status 200', () => pm.response.to.have.status(200));`,
          examples: [response('200 OK', 'OK', { status: 'ok', service: 'codearena-api' })],
        }),
      ],
    },
  ],
};

const outPath = path.join(__dirname, 'CodeArena.postman_collection.json');
fs.writeFileSync(outPath, JSON.stringify(collection, null, 2));
console.log(`Generated: ${outPath}`);
console.log(`Requests: ${collection.item.reduce((n, f) => n + f.item.length, 0)}`);
