import { Tile, EastNorth } from 'locar-tiler';
import { Pool } from 'pg';
import type { FeatureCollection, Feature, LayerKey, LayerData } from '../types/hikar';


// 301021 add conditions to restrict data returned to that actually needed
// 301021 output data in Spherical Mercator projection so it can be used in Hikar app without change


// This is code from the original (A-Frame) version of hikar.js.
// It has been converted to TypeScript; this TypeScript version specifically
// has been relicensed under MIT. The original is licensed under the GPL.

export default class MapModel {

    db: Pool;
    layerData: LayerData;
    
    constructor(db: Pool) {
        this.db = db;
     
        this.layerData = {
            ways: {
                cols : 'highway, name, designation, ref, foot, horse, bicycle, access, bridge, tunnel',
                table : 'planet_osm_line',
                conditions: "highway <> ''"
            }, 
            poi: {
                cols : 'name, "natural", place, amenity',
                table : 'planet_osm_point',
                conditions: "place <> '' OR amenity <> '' OR \"natural\" <> '' OR railway <> '' OR tourism <> ''"
            }
        };
    }

    async getMap(tile: Tile, layers: LayerKey[], outProj: string | null = null) : Promise<FeatureCollection> {
        const bl = tile.getBottomLeft(), tr = tile.getTopRight();
        return await this.doGetMap(bl, tr, layers, outProj);
    }

    async doGetMap(bl: EastNorth, tr: EastNorth, layers: LayerKey[], outProj: string | null = null) : Promise<FeatureCollection> {    
        const json = { "type": "FeatureCollection", "features": new Array<Feature>() };
        let geomCol = "", sql = "", idCol = "";
        for(const strLayer of layers.filter( lyr => this.layerData[lyr] !== undefined ))  {
            const layer = strLayer ; 
            geomCol = this.layerData[layer].geomCol || 'way';    
            idCol = this.layerData[layer].idCol || 'osm_id';    

            sql = outProj && /^\d+$/.exec(outProj) ?  
                `SELECT ${idCol}, ST_AsGeoJSON(ST_Transform(ST_Intersection(${geomCol}, bbox), ${outProj})) AS geom,${this.layerData[layer].cols} FROM ${this.layerData[layer].table}, (SELECT ST_MakeEnvelope(${bl.e},${bl.n},${tr.e},${tr.n},3857) AS bbox) AS bboxqry WHERE ${geomCol} && bbox AND (${this.layerData[layer].conditions})`:
                `SELECT ${idCol}, ST_AsGeoJSON(ST_Intersection(${geomCol}, bbox)) AS geom,${this.layerData[layer].cols} FROM ${this.layerData[layer].table}, (SELECT ST_MakeEnvelope(${bl.e},${bl.n},${tr.e},${tr.n},3857) AS bbox) AS bboxqry WHERE ${geomCol} && bbox AND (${this.layerData[layer].conditions})` ; 
            try {
                const dbres = await this.db.query(sql);
                if(dbres.rows) {
                    const features = dbres.rows.map ( row => {
                        const props = new Map<string, string>();    
                        Object.keys(row).filter (key => key != 'geom' && row[key] !== null ).forEach ( col => {
                            props.set(col, row[col]);
                        } );
                       
                        return {
                            type: 'Feature',
                            geometry: JSON.parse(row.geom),
                            properties: Object.fromEntries(props)
                        };
                    } ).filter ( f => ['Point', 'LineString', 'MultiLineString','Polygon','MultiPolygon'].indexOf(f.geometry.type) >= 0); // do not send back anything the client cannot deal with
                    json.features.push(...features);
                } else {
                    return Promise.reject({"error": "Cannot query db"});
                }
            } catch(e: any) {
                console.error(e);
                return Promise.reject({"error": "Database query error", "details": e});
            }
        }
        return json;
    }
}
