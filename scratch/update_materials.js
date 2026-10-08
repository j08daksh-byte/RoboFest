const fs = require('fs');
const file = 'D:\\\\Webs\\\\Robofest\\\\packages\\\\digital-twin\\\\src\\\\lib\\\\materials\\\\useShipMaterials.ts';
let content = fs.readFileSync(file, 'utf8');

// Add import
content = content.replace(
  "import { useTexture } from '@react-three/drei';",
  "import { useTexture } from '@react-three/drei';\nimport { useAssetBaseUrl } from '../../TwinProvider';"
);

// Add assetBaseUrl to hook
content = content.replace(
  'export function useShipMaterials() {',
  `export function useShipMaterials() {
  const assetBaseUrl = useAssetBaseUrl();`
);

// Update useTexture
content = content.replace(
  "useTexture('/textures/green_metal_rust/green_metal_rust_diff_2k.jpg');",
  "useTexture(`${assetBaseUrl}/textures/green_metal_rust/green_metal_rust_diff_2k.jpg`);"
);

fs.writeFileSync(file, content);
console.log('useShipMaterials.ts updated.');
