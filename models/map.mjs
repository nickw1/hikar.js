import jsfreemaplib from 'jsfreemaplib';


// 301021 add conditions to restrict data returned to that actually needed
// 301021 output data in Spherical Mercator projection so it can be used in Hikar app without change

export default class MapModel {

    constructor(db) {
        this.db = db;
     
        this.layerData = {
            'ways': {
                'cols' : 'highway, name, designation, ref, foot, horse, bicycle, access, bridge, tunnel',
                'table' : 'planet_osm_line',
                'conditions': "highway <> ''"
            }, 
            'pois': {
                'cols' : 'name, "natural", place, amenity',
                'table' : 'planet_osm_point',
                'conditions': "place <> '' OR amenity <> '' OR \"natural\" <> '' OR railway <> '' OR tourism <> ''"
            },
            'annotations': {
                'cols': 'text, annotationType',
                'table' : 'annotations',
                'conditions' : 'TRUE',
                'geomCol': 'xy',
                'idCol' : 'id'        
            }
        };
    }

    async getMap({x, y, z} , layers, outProj = null) {
        const tile = new jsfreemaplib.Tile(parseInt(x), parseInt(y), parseInt(z));
        const bl = tile.getBottomLeft(), tr = tile.getTopRight();
        const json = { "type": "FeatureCollection", "features": [] };
        let geomCol, sql, idCol;
        for(const layer of layers.filter( lyr => this.layerData[lyr] !== undefined ))  {
            geomCol = this.layerData[layer].geomCol || 'way';    
            idCol = this.layerData[layer].idCol || 'osm_id';    

            sql = outProj && /^\d+$/.exec(outProj) ?  
                `SELECT ${idCol}, ST_AsGeoJSON(ST_Transform(ST_Intersection(${geomCol}, bbox), ${outProj})) AS geom,${this.layerData[layer].cols} FROM ${this.layerData[layer].table}, (SELECT ST_MakeEnvelope(${bl[0]},${bl[1]},${tr[0]},${tr[1]},3857) AS bbox) AS bboxqry WHERE ${geomCol} && bbox AND (${this.layerData[layer].conditions})`:
                `SELECT ${idCol}, ST_AsGeoJSON(ST_Intersection(${geomCol}, bbox)) AS geom,${this.layerData[layer].cols} FROM ${this.layerData[layer].table}, (SELECT ST_MakeEnvelope(${bl[0]},${bl[1]},${tr[0]},${tr[1]},3857) AS bbox) AS bboxqry WHERE ${geomCol} && bbox AND (${this.layerData[layer].conditions})` ; 
            try {
                const dbres = await this.db.query(sql);
                if(dbres.rows) {
                    const features = dbres.rows.map ( row => {
                        const props = { };    
                        Object.keys(row).filter (key => key != 'geom' && row[key] !== null ).forEach ( col => {
                            props[col] = row[col];
                        } );
                        return {
                            type: 'Feature',
                            geometry: JSON.parse(row.geom),
                            properties: props
                        };
                    } );
                    json.features.push(...features);
                } else {
                    return Promise.reject({"error": "Cannot query db"});
                }
            } catch(e) {
                console.error(e);
                return Promise.reject({"error": "Database query error", "details": e});
            }
        }
        return json;
    }
}
