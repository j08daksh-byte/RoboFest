# Digital Twin Asset Manifest

The `@titan/digital-twin` package relies on the following static assets being present in the host application's public root directory.

## Textures
- `/textures/green_metal_rust/green_metal_rust_diff_2k.jpg`
- `/textures/dirty_concrete/dirty_concrete_diff_2k.jpg`
- `/textures/dirty_concrete/dirty_concrete_rough_2k.jpg`
- `/textures/dirty_concrete/dirty_concrete_nor_gl_2k.jpg`

## Models (GLTF)
- `/models/metal_tool_chest/metal_tool_chest.gltf`
- `/models/worn_metal_rack/worn_metal_rack.gltf`
- `/models/industrial_storage_cart/industrial_storage_cart.gltf`
- `/models/metal_jerrycan/metal_jerrycan.gltf`

**Important Note for Senior Integration:**
When consuming this package in Senior, you MUST copy these exact files from the RoboFest `public/` directory into Senior's `public/` directory maintaining the same path structure.
