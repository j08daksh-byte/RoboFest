const fs = require('fs');
const file = 'D:\\\\Webs\\\\Robofest\\\\packages\\\\digital-twin\\\\src\\\\components\\\\DryDock.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add import for useAssetBaseUrl
content = content.replace(
  "import { useTwinState } from '../TwinProvider';",
  "import { useTwinState, useAssetBaseUrl } from '../TwinProvider';"
);

// 2. Fix GLTFModel
content = content.replace(
  'function GLTFModel({ path, position, rotation, scale = 1 }: { path: string, position: [number, number, number], rotation: [number, number, number], scale?: number }) {',
  `function GLTFModel({ path, position, rotation, scale = 1 }: { path: string, position: [number, number, number], rotation: [number, number, number], scale?: number }) {
  const assetBaseUrl = useAssetBaseUrl();`
);
content = content.replace(
  'const { scene } = useGLTF(path) as { scene: THREE.Group };',
  'const { scene } = useGLTF(`${assetBaseUrl}${path}`) as { scene: THREE.Group };'
);

// 3. Fix useTexture calls in DryDockWalls
content = content.replace(
  'function DryDockWalls() {',
  `function DryDockWalls() {
  const assetBaseUrl = useAssetBaseUrl();`
);
content = content.replace(
  /useTexture\('\/textures\//g,
  "useTexture(`${assetBaseUrl}/textures/"
);
content = content.replace(
  /\.jpg'\);/g,
  ".jpg`);"
);

// 4. Remove preloads
content = content.replace(/useGLTF\.preload\('.*'\);\n?/g, '');

fs.writeFileSync(file, content);
console.log('DryDock.tsx updated.');
