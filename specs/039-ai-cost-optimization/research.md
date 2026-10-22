# Research: AI Model Cost Optimization

**Date**: 2026-10-21 | **Status**: Complete

No unknowns in specification. All technical decisions clear from existing project context.

## Design Decisions

### 1. Mock Data Format

**Decision**: Static pre-defined responses (no AI generation).

**Rationale**: 
- Goal is cost reduction, not realistic mock data.
- Static responses sufficient for testing UI/workflows.
- Avoids secondary API call to generate mocks.

**Alternatives Rejected**:
- Generate mock data via API: Defeats cost-saving purpose.
- Use real data from production: Requires external connectivity, breaks offline testing.

**Implementation**: Objects with same types as real responses:
- Text: `{ definition: string, sentences: string[], best: number, ipa: string }`
- Audio: `Uint8Array` (minimal WAV header: 12 bytes)
- Image: `Uint8Array` (1x1 pixel JPEG: ~615 bytes)

---

### 2. Cost Estimation Strategy

**Decision**: Hardcoded cost map by model name. Initial pricing based on Google AI pricing tiers.

**Rationale**:
- Simple, no external API needed.
- Pricing relatively stable; hardcoding acceptable for MVP.
- Can refactor to dynamic pricing later if needed.

**Alternatives Rejected**:
- Call Google API for pricing: Extra API call defeats cost saving.
- Store in SQLite: Overkill for static data.

**Initial Pricing Map**:
| Model Type | Example | Cost Per Call | Notes |
|-----------|---------|---------------|-------|
| Text | gemini-3.8-flash | $0.01 | Cheapest tier |
| Audio | gemini-3.8-flash-tts | $0.02 | Higher than text |
| Image | gemini-3.1-flash-lite-image | $0.05 | Most expensive |

---

### 3. Logging Storage

**Decision**: In-memory array initially. Can migrate to SQLite if volume grows.

**Rationale**:
- Simplest approach; logs live in Electron main process.
- Fast enough for manual inspection in dev.
- No database migration needed for MVP.

**Alternatives Rejected**:
- SQLite from start: Over-engineered for single developer testing.
- File-based CSV: Harder to parse; harder to query.
- Cloud logging: Privacy concerns; complexity.

**Implementation**: Store APICallLog[] in Electron main process state. Expose via IPC if UI needs to display.

---

### 4. Model Selection UI

**Decision**: Reuse existing `imageModel` field in Connect AI settings dialog.

**Rationale**:
- Field already exists (from spec 036).
- No UI changes needed.
- User can set any model name; system validates.

**Alternatives Rejected**:
- New settings dialog: Unnecessary; UI already there.
- Hardcode model name: Removes user choice benefit.

---

### 5. MOCK_AI Environment Variable

**Decision**: Standard Node.js `process.env.MOCK_AI === "1"` check.

**Rationale**:
- Standard Node.js pattern.
- Easy to set in shell: `MOCK_AI=1 pnpm dev`
- No code bloat; simple conditional.

**Alternatives Rejected**:
- Config file: Requires restarting app to change.
- Runtime UI toggle: Requires React state sync across processes.
- Separate `MOCK_TEXT`, `MOCK_AUDIO`, `MOCK_IMAGE`: Too granular for MVP; can add later.

---

### 6. Error Handling for Failures

**Decision**: No automatic retries. User-initiated retry only.

**Rationale**:
- Matches spec requirement (FR-007).
- Prevents retry storms that waste API credits.
- User controls retry timing.

**Alternatives Rejected**:
- Exponential backoff: Hides cost accrual; user unaware.
- Circuit breaker: Adds complexity; not needed for cost control.

---

## Decision Table

| Question | Decision | Rationale | Trade-off |
|----------|----------|-----------|-----------|
| Mock data realism? | Static objects | Cost-saving; sufficient for testing | Less realistic than AI-generated mocks |
| Cost lookup method? | Hardcoded map | Simple; fast | Requires manual update if pricing changes |
| Log storage? | In-memory array | Simple; no DB | Can't persist logs across restarts |
| Model selection UI? | Reuse existing field | No new code | Assumes user trusts price estimates |
| Environment pattern? | `process.env.MOCK_AI` | Standard Node.js | Not user-friendly for non-devs |
| Retry behavior? | Manual only | Prevents waste | User must manually retry if network fails |
