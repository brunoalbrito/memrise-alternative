# Data Model: Fix Image Trigger and Text in Pictures

No persisted data changes. The image state of `specs/011-ai-word-image/data-model.md` is unchanged. It starts as
`idle` and stays `idle` until a sentence is chosen or "Create image" is pressed; a synchronous index tracker
(`imageIndexRef`, not state) prevents duplicate requests for one click.
