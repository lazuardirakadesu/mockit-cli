# ⚡ MockIt

**Zero-Config Stateful Mock API Server CLI** for frontend and mobile developers.

Spin up a production-like local REST API server in seconds from a simple JSON or YAML config file. Unlike static mock servers, MockIt is **stateful** — your `POST`, `PUT`, `PATCH`, and `DELETE` mutations persist locally without mutating your seed files.

[![Version](https://img.shields.io/badge/version-v2.0.0-blue.svg)]()
[![Tests](https://img.shields.io/badge/tests-47%20passed-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node: >=18](https://img.shields.io/badge/node-%3E%3D18-green.svg)]()

---

## ✨ Features

- 🖥️ **Embedded Web Studio Dashboard (`/_studio`)** — Offline-ready visual dashboard with Linear / Vercel Precision Dark aesthetic. Inspect and mutate mock records, tweak latency and chaos sliders in real time, and monitor live request logs.
- 🚀 **Zero-Config Startup** — Auto-discovers `mock.config.json` or `mock.config.yaml` in your working directory.
- 🔄 **Automatic CRUD Routes** — Generates complete RESTful endpoints (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) for every collection.
- 💾 **Stateful Persistence** — All mutations automatically save to a local database (`.mockdb.json`) and survive server restarts while keeping your original seed intact.
- 🔍 **Filtering, Sorting & Pagination** — Built-in support for `?_page=1&_limit=10`, `?_sort=price&_order=desc`, `?_search=term`, and exact property filters like `?role=admin`.
- ⏱️ **Latency Simulation (`--delay <ms>`)** — Test frontend loading spinners, skeleton states, and optimistic UI updates.
- 💥 **Chaos Mode (`--error-rate <0-100>`)** — Randomly inject `500 Internal Server Error` responses to stress-test error boundaries and retry logic.
- 🛡️ **Optional Schema Validation** — Validate request payloads against field types, required fields, and unique constraints.
- 🔀 **Custom Static Routes** — Mock auth endpoints, health checks, or arbitrary webhook responses with template strings.
- 🎨 **Beautiful DX** — Clean, colorful terminal table showing active endpoints, HTTP methods, response times, and Web Studio link.

---

## ⚡ Quickstart

### 1. Run with `npx` (No installation needed)

```bash
npx mockit-server start
```

Or install globally:

```bash
npm install -g mockit-server
mockit start
```

### 2. Create `mock.config.json`

Create a file named `mock.config.json` in your project root:

```json
{
  "server": {
    "port": 4000
  },
  "resources": {
    "users": {
      "seed": [
        { "id": 1, "name": "Alice Johnson", "email": "alice@example.com", "role": "admin" },
        { "id": 2, "name": "Bob Smith", "email": "bob@example.com", "role": "user" }
      ],
      "fields": {
        "id": { "type": "number", "auto": true },
        "name": { "type": "string", "required": true },
        "email": { "type": "string", "required": true, "unique": true },
        "role": { "type": "string", "enum": ["admin", "user", "guest"], "default": "user" }
      }
    },
    "products": {
      "seed": [
        { "id": 1, "name": "Mechanical Keyboard", "price": 89.99, "stock": 50 },
        { "id": 2, "name": "Ergonomic Mouse", "price": 49.99, "stock": 120 }
      ]
    }
  },
  "routes": {
    "GET /api/health": {
      "status": 200,
      "body": { "status": "ok", "uptime": "{{uptime}}" }
    },
    "POST /api/login": {
      "status": 200,
      "body": { "token": "mock-jwt-{{timestamp}}" }
    }
  }
}
```

### 3. Start the Server

```bash
npx mockit-server start --port 4000
```

---

## 🛠️ CLI Usage & Flags

```bash
mockit start [options]
```

| Flag | Shorthand | Description | Default |
|---|---|---|---|
| `--config <path>` | `-c` | Path to config file (`.json` or `.yaml`) | Auto-detects `mock.config.json` |
| `--port <number>` | `-p` | Server port | `3210` (or `server.port` from config) |
| `--host <host>` | `-H` | Server host | `localhost` |
| `--delay <ms>` | `-d` | Artificial network delay in milliseconds | `0` |
| `--error-rate <0-100>` | `-e` | Percentage chance of random 500 error | `0` |
| `--watch` | `-w` | Watch config file for changes | `false` |
| `--no-ui` | | Disable embedded Web Studio dashboard | `false` (UI enabled by default) |
| `--db-file <path>` | | Custom persistence storage path | `.mockdb.json` |

### Reset Persisted Data

To delete the local `.mockdb.json` and reset back to original seed data:

```bash
mockit reset
```

---

## 📡 REST API Endpoints

For any resource key defined in `resources` (e.g., `users`), MockIt automatically exposes:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/:resource` | List all records (supports query parameters) |
| `GET` | `/api/:resource/:id` | Fetch a single record by ID |
| `POST` | `/api/:resource` | Create a new record (auto-increments `id`, validates fields) |
| `PUT` | `/api/:resource/:id` | Full replacement of a record |
| `PATCH` | `/api/:resource/:id` | Partial update of a record |
| `DELETE` | `/api/:resource/:id` | Delete a record |

### Query Parameters

| Parameter | Example | Description |
|---|---|---|
| `_page` & `_limit` | `/api/users?_page=2&_limit=10` | Paginate results. Includes `X-Total-Count` and RFC 5988 `Link` headers. |
| `_sort` & `_order` | `/api/products?_sort=price&_order=desc` | Sort by field name (`asc` or `desc`). |
| `_search` | `/api/products?_search=keyboard` | Full-text case-insensitive search across all string fields. |
| Exact field filter | `/api/users?role=admin` | Filter by matching any property value. |

---

## 📦 Programmatic Usage

You can also use MockIt programmatically in tests or custom Node.js scripts:

```typescript
import { createServer, DataStore, Persistence, resolveConfig } from 'mockit-server';

const config = resolveConfig('mock.config.json', {
  resources: {
    todos: {
      seed: [{ id: 1, title: 'Learn MockIt', done: false }]
    }
  }
});

const store = new DataStore();
const persistence = new Persistence('.testdb.json');
const server = createServer(config, store, persistence);

// Stop server when finished
// server.close();
```

---

## 🧪 Testing

MockIt is built with comprehensive unit and integration tests using [Vitest](https://vitest.dev/):

```bash
# Run test suite
npm run test

# Typecheck
npm run typecheck

# Build CLI binary & library
npm run build
```

---

## 📄 License

MIT License © 2026 Lazuardi Raka
