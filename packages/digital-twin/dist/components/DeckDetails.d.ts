import React from 'react';
import { ProceduralShipSurface } from '../lib/geometry/ProceduralShipSurface';
import { useShipMaterials } from '../lib/materials/useShipMaterials';
export declare function DeckDetails({ surface, materials }: {
    surface: ProceduralShipSurface;
    materials: ReturnType<typeof useShipMaterials>;
}): React.JSX.Element;
export declare function BridgeDetails({ materials }: {
    materials: ReturnType<typeof useShipMaterials>;
}): React.JSX.Element;
