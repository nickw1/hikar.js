
export interface PointGeometry {
    coordinates: [number,number] | [number,number,number];
    type: string;
}

export interface LineGeometry {
    coordinates: Array<[number,number] | [number,number,number]>; 
    type: string;
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
