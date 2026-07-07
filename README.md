# CodeArena Backend

Production-ready REST API backend for **CodeArena** — a LeetCode-style coding platform.

## Tech Stack

- **Node.js** + **TypeScript** (strict mode)
- **Express.js** — REST API
- **MongoDB Atlas** + **Mongoose** ODM
- **Redis** — submission queue + TTL caching
- **JWT** — access + refresh token auth
- **Zod** — request validation
- **Docker** — containerized deployment

## Architecture

```
Frontend (Next.js + Monaco Editor)
          |
          v
    Backend API (Express)
          |
    +-----+-----+
    v           v
 MongoDB      Redis
                  |
                  v
         Code Execution Service
         (https://api.rumjot.me)
```

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB Atlas connection string
- Redis instance
- Code execution API token

### Setup

```bash
cp .env.example .env
# Edit .env with your credentials

npm install
npm run seed    # Seed default tags
npm run dev     # Start API server
npm run dev:worker  # Start submission worker (separate terminal)
```

### Docker

```bash
cp .env.example .env
docker compose up --build
```

This starts the API, worker, and Redis.

## Project Structure

```
src/
├── config/           # Environment & constants
├── database/         # MongoDB connection & seed
├── modules/
│   ├── auth/         # Registration, login, JWT
│   ├── users/        # User profiles & stats
│   ├── problems/     # Problem CRUD & listing
│   ├── submissions/  # Code submission & history
│   └── tags/         # Problem tags
├── queues/           # Redis submission queue & worker
├── redis/            # Redis client & cache helpers
├── services/
│   └── execution/    # External code execution API
├── middlewares/      # Auth, validation, rate limiting
└── utils/            # Errors, helpers, responses
```

## API Documentation

All responses follow this format:

```json
{ "success": true, "data": { ... } }
```

Errors:

```json
{ "success": false, "message": "Error description" }
```

Authentication uses `Authorization: Bearer <access_token>` header.

---

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/logout` | No | Logout (requires refresh token in body) |
| POST | `/api/auth/refresh` | No | Refresh access token |
| GET | `/api/auth/me` | Yes | Get current user |

**Register / Login body:**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "username": "johndoe", "role": "USER" },
    "accessToken": "eyJ...",
    "refreshToken": "abc..."
  }
}
```

---

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/:username` | No | Get user profile |

**Response:**

```json
{
  "success": true,
  "data": {
    "username": "johndoe",
    "avatar": "",
    "totalSolved": 42,
    "easySolved": 20,
    "mediumSolved": 15,
    "hardSolved": 7,
    "recentSubmissions": [...]
  }
}
```

---

### Problems

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/problems` | Optional | List problems (paginated, filterable) |
| GET | `/api/problems/:idOrSlug` | Optional | Get problem details (ObjectId or slug) |
| POST | `/api/problems` | Admin | Create problem |
| PUT | `/api/problems/:id` | Admin | Update problem |
| DELETE | `/api/problems/:id` | Admin | Delete problem |

**Get problem by slug:**

```
GET /api/problems/sum-of-array-elements
```

Response includes `hints` (difficulty-based), `timeLimit`, `memoryLimit`, and C++ `starterCode`.

**List query params:**

```
?page=1&limit=20&difficulty=MEDIUM&tag=dp&search=two&status=solved
```

**Create problem body:**

```json
{
  "title": "Two Sum",
  "description": "Given an array of integers...",
  "difficulty": "EASY",
  "tags": ["Array", "Hash Table"],
  "constraints": "2 <= nums.length <= 10^4",
  "examples": [
    { "input": "nums = [2,7], target = 9", "output": "[0,1]" }
  ],
  "starterCode": {
    "cpp": "#include <bits/stdc++.h>\n..."
  },
  "testCases": [
    { "input": "3\n1 2 3", "expectedOutput": "6" }
  ]
}
```

> Platform supports **C++ only** (`language_id: 54`) for code execution.

---

### Submissions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/submissions/run` | Yes | Run against **visible** test cases (sync) |
| POST | `/api/submissions` | Yes | Submit for **full** judging (async) |
| GET | `/api/submissions/history` | Yes | Submission history |
| GET | `/api/submissions/:id` | Yes | Get submission details |

**Run body (public test cases, synchronous):**

```json
{
  "problemId": "sum-of-array-elements",
  "code": "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() { ... }"
}
```

**Submit body (all test cases, async — requires worker):**

```json
{
  "problemId": "sum-of-array-elements",
  "code": "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() { ... }"
}
```

- `problemId` accepts MongoDB ObjectId or slug
- Language defaults to `cpp` (Judge0 `language_id: 54`)
- Code must be a **complete C++ program** with `main()` reading stdin / printing stdout

**Submission flow:**

1. **Run** → judges visible test cases via CodeBox (`POST /submissions?wait=true` + `expected_output`)
2. **Submit** → stored as `PENDING`, queued in Redis
3. Worker sets `RUNNING` → judges all test cases (visible + hidden)
4. Status updated (`ACCEPTED`, `WRONG_ANSWER`, `TIME_LIMIT`, `ERROR`)
5. On acceptance, user stats updated

---

### Tags

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/tags` | No | List all tags |

---

## Security

- **Helmet** — HTTP security headers
- **CORS** — configurable origin
- **Rate limiting** — global (100/15min), auth (20/15min), submissions (10/min)
- **bcrypt** — password hashing (12 rounds)
- **JWT** — short-lived access tokens + refresh token rotation
- **Zod** — strict input validation
- **Role-based access** — `USER` and `ADMIN` roles

## Environment Variables

See [`.env.example`](.env.example) for all configuration options.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API in development mode |
| `npm run dev:worker` | Start submission worker |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled API |
| `npm run start:worker` | Run compiled worker |
| `npm run seed` | Seed default tags |
| `npm run generate:problems` | Regenerate `data/problems-dataset.json` |
| `npm run import:problems` | Import dataset into MongoDB |
| `npm run postman:generate` | Regenerate Postman collection |

## Postman

Import [`postman/CodeArena.postman_collection.json`](postman/CodeArena.postman_collection.json).

```bash
npm run postman:generate   # refresh after API changes
```

Collection variables include sample problem slugs by difficulty from `data/problems-manifest.json`:
- `easyProblemSlug` → `sum-of-array-elements`
- `mediumProblemSlug` → `find-pivot-index`
- `hardProblemSlug` → `target-sum-assign-signs`

**Recommended flow:** Login → Get All Problems → Get Problem By Slug → Run Code → Submit Code → Get Submission

## Future-Ready Architecture

The modular structure supports future features without major refactoring:

- Online contests
- Discussion forum
- AI coding hints
- Company-specific questions
- Editorial solutions
- Subscription plans
- Gamification

## License

MIT
