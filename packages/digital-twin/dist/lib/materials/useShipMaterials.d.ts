import * as THREE from 'three';
export declare function useShipMaterials(xRayMode?: boolean): {
    hullPaint: THREE.MeshStandardMaterial;
    hullAntiFouling: THREE.MeshStandardMaterial;
    deckMaterial: THREE.MeshStandardMaterial;
    superstructurePaint: THREE.MeshStandardMaterial;
    glass: THREE.MeshStandardMaterial;
    equipmentMetal: THREE.MeshStandardMaterial;
    hatchMetal: THREE.MeshStandardMaterial;
    funnelMaterial: THREE.MeshStandardMaterial;
    warningPaint: THREE.MeshStandardMaterial;
};
