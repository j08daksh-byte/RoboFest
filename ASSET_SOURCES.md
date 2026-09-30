# Asset Sources

This document tracks external texture and 3D assets used in the project.

## Current Assets

**Procedural Canvas Textures**
* **Source:** `src/lib/materials/useShipMaterials.ts` (Internal Procedural Generator)
* **License:** MIT / Internal
* **Used for:** 
  * Hull paint (roughness/albedo noise)
  * Anti-fouling coating (roughness/albedo noise)
  * Deck steel (anti-slip micro-texture)
  * Superstructure paint (subtle weathering noise)
  * Funnel soot (canvas linear gradient)
* **Rationale:** The current phase (Phase 6B) uses lightweight, deterministic HTML5 Canvas generation to create seamless tileable noise maps. This achieves subtle industrial weathering (roughness variation, grime) without requiring heavy external image downloads, maintaining perfect browser performance and avoiding any CC0/copyright compliance issues.

*(Note: When real photographic CC0 textures are introduced in later phases, e.g. from Poly Haven, they will be downloaded to `public/textures/ship/...` and documented here.)*
