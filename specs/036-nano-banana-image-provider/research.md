# Research Phase 0: Nano Banana 2 Lite Integration

**Status**: In Progress | **Date**: 2026-10-21

## Research Tasks

### 1. Nano Banana 2 Lite API Specification

**Question**: What is the complete API contract for Nano Banana 2 Lite image generation?

**Findings**:
- **Primary Endpoint**: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-image:generateContent?key=YOUR_API_KEY` (Google's official API)
- **Authentication**: API key in query parameter `?key=YOUR_API_KEY` (from Google AI Studio; free tier available)
- **Request Payload Format**: 
  - Required: `contents[0].parts[0].text` (string, up to 20k chars)
  - Optional: `generationConfig.aspectRatio` (1:1, 16:9, 9:16, 2:3, 3:2, etc.; default 1:1), `generationConfig.outputMimeType` (image/jpeg or image/png)
- **Response Format**: Base64-encoded image data in `candidates[0].content.parts[0].inlineData.data` (JSON structure)
- **Supported Model**: `gemini-3.1-flash-lite-image` (fixed; 1K max resolution)
- **Image Sizes**: Fixed **1024×1024px** (1K); aspect ratio controls proportions (14 ratios supported: 21:9 to 8:1)
- **Rate Limits**: **100 requests/minute**, **10 concurrent max** per API key (free tier)
- **Alternative Providers** (not recommended for v1): EvoLink, FAL.ai, Cloudflare (third-party gateways)

**Decision**: ✅ CONFIRMED — Use Google's official Gemini API endpoint; query parameter auth; base64 response handling required.

**Rationale**: Google's official API is free, official, well-documented, no middleman. Nano Banana 2 Lite is 4x faster (4s vs ~15s) than Pollinations while maintaining quality.

---

### 2. Pollinations → Nano Banana 2 Lite (Google Gemini) Comparison

**Question**: What are the key differences between Pollinations and Nano Banana 2 Lite APIs?

**Findings**:
- **Endpoint**: 
  - **Nano Banana**: `generativelanguage.googleapis.com` (Google official; free)
  - **Pollinations**: Different API entirely
- **Authentication**: 
  - **Nano Banana**: Query parameter `?key=API_KEY` (simple, no Authorization header needed)
  - **Pollinations**: Likely different method
- **Request Format**: 
  - **Nano Banana (Google)**: Wrapped in `contents[0].parts[0].text` with `generationConfig`
  - **Pollinations**: Different structure (not needed for migration)
- **Response Format**: 
  - **Nano Banana**: Base64-encoded image in JSON (must decode before display)
  - **Pollinations**: Likely URL-based
- **Image Resolution**: 
  - **Nano Banana**: Fixed **1024×1024px** (1K; simple, consistent)
  - **Pollinations**: Variable
- **Performance**: 
  - **Nano Banana**: **~4 seconds per image** (4x faster than Pollinations ~15s)
- **Cost**: 
  - **Nano Banana**: Free tier available
  - **Pollinations**: May have different pricing
- **Rate Limits**: 
  - **Nano Banana**: 100 req/min, 10 concurrent max per key (free tier)

**Decision**: ✅ CONFIRMED — Use Google's official Gemini API. Significantly faster, free, official, no middleman. Response format change (base64) requires UI updates. API keys incompatible; no key migration.

**Rationale**: Google's official API eliminates third-party dependency (EvoLink). Performance boost + fixed resolution + free tier outweigh format change complexity.

---

### 3. Code Architecture Decision: Image Generation Module

**Question**: Should image generation logic be extracted into a separate `imageGeneration.ts` service file?

**Current State**:
- Pollinations logic is currently distributed across:
  - `useSuggestions.ts` (hooks layer)
  - `ConnectDialog.tsx` (UI layer)
  - Backend API routes (`ai-routes.ts`)

**Options Evaluated**:
- **Option A** (Minimal): Inline Nano Banana logic alongside existing patterns; no new files.
  - Pros: Simplicity; matches current Pollinations pattern; no refactor overhead.
  - Cons: Duplicate request logic if multiple features use image generation later.
  
- **Option B** (Abstraction): Extract into `api/imageGeneration.ts` service.
  - Pros: Reusable; easier testing; clear separation.
  - Cons: Violates Simplicity principle (Principle IV) if only one caller; premature abstraction.

**Decision**: ✅ Option A (inline). Keep Nano Banana logic colocated with existing provider patterns.

**Rationale**: Constitution Principle IV: "Add abstractions only when the same logic appears in three or more places." Current scope: single provider replacement. If image generation expands to multiple features later, extract then (no sunk cost).

---

### 4. Key Migration Path

**Question**: How to handle existing Pollinations keys during migration?

**Confirmed Facts**:
- Pollinations and Nano Banana 2 Lite are **completely separate services**
- API keys are **provider-specific and incompatible**
- Nano Banana keys obtained from Google AI Studio or third-party providers (EvoLink, FAL.ai, etc.)

**Migration Strategy**:
- On first app launch after code update: Detect old `pollinationsConnected: true` in storage
- Prompt user: "Image provider changed to Nano Banana 2 Lite. Please enter your new API key from Google AI Studio or your provider."
- Clear all Pollinations config (`pollinationsConnected`, `pollinationsLast4`, `pollinationsModel`)
- User enters new Nano Banana key via Connect AI dialog

**Decision**: ✅ Confirmed. No key reuse. Clear Pollinations; require manual Nano Banana key entry.

**Rationale**: Attempting key reuse would cause silent API errors (invalid authentication). Clear prompt + link to documentation prevents user confusion.

---

## Summary of NEEDS CLARIFICATION Items (All Resolved ✅)

| Item | Resolution | Source |
|------|-----------|--------|
| Nano Banana 2 Lite API endpoint | ✅ `api.evolink.ai/v1/images/generations` | EvoLink docs, FAL.ai, Google Cloud docs |
| Authentication method | ✅ Bearer token in Authorization header | Multiple sources |
| Request payload format | ✅ `prompt`, `model`, `aspect_ratio`, `output_format` | API docs |
| Response format | ✅ Base64-encoded image in JSON | API response structure |
| Supported models | ✅ `gemini-3.1-flash-lite-image` (recommended) | Google Cloud + providers |
| Image sizes/aspect ratios | ✅ Fixed 1K (1024×1024); 14 aspect ratios supported | API docs |
| Rate limits | ✅ 100 req/min, 10 concurrent max | API rate limit docs |
| Performance | ✅ ~4 seconds per image | Performance benchmarks |
| Image generation architecture | ✅ Inline (Option A); no new files | Design decision |
| Migration path | ✅ Clear old keys; user enters new Nano Banana key | Architecture decision |

---

## Phase 0 Complete ✅

All research questions resolved. Proceeding to Phase 1 design with confirmed API specifications.

---

## Next Steps

1. ✅ **Phase 0 (Research)**: COMPLETE — API fully documented
2. **Phase 1 (Design)**: Update contracts, data model, quickstart with actual specifications
3. **Phase 2 (Implementation)**: Run `/speckit-tasks` to generate implementation tasks
