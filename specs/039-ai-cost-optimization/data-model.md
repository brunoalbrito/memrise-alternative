# Data Model: AI Model Cost Optimization

**Feature**: AI Cost Optimization (spec 039) | **Date**: 2026-10-21

## Core Entities

### 1. MockData

Pre-defined static responses returned when `MOCK_AI=1`. Not persisted; defined as constants in `electron/services/ai/service.ts`.

**Purpose**: Replace real API calls during development/testing to eliminate cost.

**Fields**:

| Field | Type | Example | Constraints |
|-------|------|---------|-------------|
| textDefinition | string | "A written or printed work..." | Max 100 words; must be valid English |
| textSentences | string[] | ["The book is on the table.", ...] | Exactly 3 sentences; each ≤30 words |
| textBestIndex | number | 0 | 0 ≤ index < 3 |
| textIPA | string | "/bʊk/" | Valid IPA notation |
| audioWAV | Uint8Array | [0x52, 0x49, 0x46, ...] | Min 44 bytes (valid WAV header); max 1MB |
| imageJPEG | Uint8Array | [0xFF, 0xD8, 0xFF, ...] | Valid JPEG magic bytes; 1x1 to 4096x4096 px |

**Example Implementation** (TypeScript):

```typescript
const MOCK_DATA = {
  definition: "A bound set of printed or written pages",
  sentences: [
    "I read the book yesterday.",
    "She borrowed my favorite book.",
    "That book costs $20."
  ],
  best: 0,
  ipa: "/bʊk/",
  audioWAV: new Uint8Array([0x52, 0x49, 0x46, 0x46, ...]), // minimal WAV
  imageJPEG: new Uint8Array([0xFF, 0xD8, 0xFF, ...]) // 1x1 JPEG
};
```

---

### 2. APICallLog

Record of each API call made to Google Generative AI. Stored in-memory; can be queried or exported for cost tracking.

**Purpose**: Track API usage, estimate costs, identify expensive operations.

**Fields**:

| Field | Type | Example | Constraints |
|-------|------|---------|-------------|
| id | string | "2026-10-21T14:30:45.123Z-text-0" | Timestamp + operation + sequence; unique |
| timestamp | Date | 2026-10-21T14:30:45.123Z | ISO 8601; UTC; server time |
| operation | "text" \| "audio" \| "image" | "image" | One of 3 operation types |
| modelName | string | "gemini-3.1-flash-lite-image" | From Connect AI settings or default |
| costEstimate | number | 0.05 | In USD; 2+ decimals |
| success | boolean | true | true = API returned data; false = error |
| errorType | string \| undefined | "limit" | From AiError.kind if failed; optional |
| word | string \| undefined | "book" | The word being processed; optional; helpful for debugging |
| word_sentence | string \| undefined | "The book is on the table" | Context; optional |
| durationMs | number | 1234 | Milliseconds from request to response |

**Relationships**:
- One APICallLog per API call
- Multiple logs per user session (many-to-one)
- Logs aggregated by operation type for cost breakdown

**Example** (TypeScript):

```typescript
interface APICallLog {
  id: string;
  timestamp: Date;
  operation: "text" | "audio" | "image";
  modelName: string;
  costEstimate: number;
  success: boolean;
  errorType?: string;
  word?: string;
  word_sentence?: string;
  durationMs: number;
}

// Example log entry:
const log: APICallLog = {
  id: "2026-10-21T14:30:45.123Z-image-0",
  timestamp: new Date("2026-10-21T14:30:45.123Z"),
  operation: "image",
  modelName: "gemini-3.1-flash-lite-image",
  costEstimate: 0.05,
  success: true,
  word: "book",
  word_sentence: "The book is on the table",
  durationMs: 3450
};
```

---

### 3. ModelPricing

Lookup table for cost per API call by model name. Not persisted; defined as constant map in `electron/services/ai/service.ts`.

**Purpose**: Enable cost estimation without external API calls.

**Fields**:

| Field | Type | Example | Constraints |
|-------|------|---------|-------------|
| modelName | string | "gemini-3.8-flash" | Full model name as used by SDK |
| costPerCall | number | 0.01 | In USD; must be ≥ 0 |
| operation | "text" \| "audio" \| "image" | "text" | Classifies model usage |

**Example Implementation**:

```typescript
const MODEL_PRICING: Record<string, { cost: number; operation: string }> = {
  "gemini-3.8-flash": { cost: 0.01, operation: "text" },
  "gemini-3.8-flash-tts": { cost: 0.02, operation: "audio" },
  "gemini-3.1-flash-lite-image": { cost: 0.05, operation: "image" },
  // Add more models as they become available
};

function estimateCost(modelName: string): number {
  return MODEL_PRICING[modelName]?.cost ?? 0.01; // default to text price
}
```

---

### 4. CostSummary (Derived)

Aggregated view of API call costs. Computed from APICallLog array. Not persisted; calculated on demand.

**Purpose**: Present cost breakdown to user (e.g., "Total: $0.25 for 5 calls").

**Fields**:

| Field | Type | Example | Calculation |
|-------|------|---------|-------------|
| totalCost | number | 0.25 | Sum of all APICallLog.costEstimate |
| totalCalls | number | 5 | Count of APICallLog entries |
| costByOperation | object | { text: 0.05, audio: 0.10, image: 0.10 } | Group by operation, sum |
| costByModel | object | { "gemini-3.1-flash-lite-image": 0.15, ... } | Group by modelName, sum |
| mostExpensiveCall | APICallLog | (log entry) | Max APICallLog.costEstimate |
| averageCostPerCall | number | 0.05 | totalCost / totalCalls |

**Example Implementation**:

```typescript
function calculateCostSummary(logs: APICallLog[]): CostSummary {
  const summary = {
    totalCost: logs.reduce((sum, log) => sum + log.costEstimate, 0),
    totalCalls: logs.length,
    costByOperation: {} as Record<string, number>,
    costByModel: {} as Record<string, number>,
    mostExpensiveCall: logs[0],
    averageCostPerCall: 0,
  };

  // Group by operation
  logs.forEach(log => {
    summary.costByOperation[log.operation] ??= 0;
    summary.costByOperation[log.operation] += log.costEstimate;

    summary.costByModel[log.modelName] ??= 0;
    summary.costByModel[log.modelName] += log.costEstimate;

    if (log.costEstimate > (summary.mostExpensiveCall?.costEstimate ?? 0)) {
      summary.mostExpensiveCall = log;
    }
  });

  summary.averageCostPerCall = summary.totalCost / summary.totalCalls;
  return summary;
}
```

---

## State Management

### Electron Main Process (electron/services/ai/service.ts)

```typescript
class AiService {
  private apiCallLogs: APICallLog[] = [];

  // When API call made (real or mock):
  private logApiCall(log: APICallLog): void {
    this.apiCallLogs.push(log);
    console.log(`[API] ${log.operation} via ${log.modelName}: $${log.costEstimate.toFixed(4)}`);
  }

  // Query logs:
  getApiCallLogs(): APICallLog[] {
    return [...this.apiCallLogs]; // return copy
  }

  getCostSummary(): CostSummary {
    return calculateCostSummary(this.apiCallLogs);
  }

  // Clear logs (useful for test runs):
  clearApiCallLogs(): void {
    this.apiCallLogs = [];
  }
}
```

### React UI (optional, for displaying costs)

If user wants to see costs in UI:
- Query costs via IPC: `ipcRenderer.invoke("ai:getCostSummary")`
- Display in a new "Cost Monitor" panel or modal
- Update on every API call via IPC event

---

## Validation Rules

### APICallLog
- **timestamp**: Must be ISO 8601 format, UTC timezone
- **operation**: Must be one of "text", "audio", "image"
- **modelName**: Must be non-empty string; can include "/" (e.g., "models/gemini-3.1-...")
- **costEstimate**: Must be ≥ 0; recommended max $1.00 per call (to catch pricing errors)
- **durationMs**: Must be ≥ 0; recommended ≤ 300000 (5 minutes max)
- **success**: If false, errorType must be set to one of AiError.kind values

### MockData
- **textSentences**: Must have exactly 3 entries
- **textBestIndex**: Must be 0, 1, or 2
- **audioWAV**: Must be valid WAV file (starts with RIFF header: 0x52, 0x49, 0x46, 0x46)
- **imageJPEG**: Must be valid JPEG file (starts with 0xFF, 0xD8)

---

## Migration Plan (Future)

If logs need persistence:
1. Create SQLite table: `CREATE TABLE api_call_logs (id TEXT PRIMARY KEY, ...)`
2. Use better-sqlite3 in Electron main process
3. Write logs to DB on each call (no performance impact)
4. Load logs from DB on app startup for cost history
5. Add cleanup: Delete logs older than 30 days (user configurable)
