
export interface PointGeometry {
    coordinates: number[];
}

export interface LineGeometry {
    coordinates: number[][];
}

export interface Feature {
    type: string;
    properties: any; 
    geometry: PointGeometry | LineGeometry;
}

export interface FeatureCollection {
   type: string;
   features: Array<Feature>;
}

export interface LayerInfo {
    cols: string;
    table: string;
    conditions: string;
    geomCol?: string;
    idCol?: string;
}

export interface LayerData {
    ways: LayerInfo;
    poi: LayerInfo;
}

export type LayerKey = keyof LayerData;
