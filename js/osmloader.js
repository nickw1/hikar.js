const OsmWay = require('./osmway');
const GoogleProjection = require('jsfreemaplib').GoogleProjection;

class OsmLoader {
    constructor() {
        this.drawProps = { 'footway' : {  color:'#00ff00' },
             'path' : {  color: '#00ff00'},
             'steps' : { color: '#00ff00' },
             'bridleway' : {  color: '#ffc000'},
             'byway' : { color: '#ff0000' },
            'track' :  { color: '#ff8080' },
            'cycleway' : { color: '#0000ff' },
            'residential' : { },
            'unclassified' : { },
            'tertiary' :  {  },
            'secondary' : { },
            'primary' : { },
            'trunk' : { },
            'motorway' : { }
        };
        this.sphMerc = new GoogleProjection();
    }

    loadOsm(osmData, tileid, dem=null) {
        const features = { ways: [], pois: [] };
        osmData.features.forEach  ( (f,i)=> {
            const line = [];
            if(f.geometry.type=='LineString' && f.geometry.coordinates.length >= 2) {
                f.geometry.coordinates.forEach (coord=> {
            
                    const h = dem? dem.getHeight(coord[0], coord[1]) : 0;
                    if (h >= 0) {
                        line.push([coord[0], h-20, -coord[1]]);
                    }
               });
                    
                
                if(line.length >= 2) {
                    const g = this.makeWayGeom(line,     
                       
                        (this.drawProps[f.properties.highway] ? 
                            (this.drawProps[f.properties.highway].width || 5) :
                         5));

                   const color = this.drawProps[f.properties.highway] ?
                    (this.drawProps[f.properties.highway].color||'#ffffff'):
                    '#ffffff';
                   features.ways.push({
                       geometry: g, 
                       properties: {
                           id: `${tileid}:${f.properties.osm_id}`,
                           color: color
                       }
                   }); 
                }
            } else if(f.geometry.type == 'Point') {
                const h = dem ? dem.getHeight(f.geometry.coordinates[0], f.geometry.coordinates[1]) : 0;
                if(h >= 0) {
                    const lonLat = this.sphMerc.unproject(f.geometry.coordinates); 
                    features.pois.push({
                        geometry: [
                            f.geometry.coordinates[0],
                            h,
                            f.geometry.coordinates[1]
                        ],
                        properties: Object.assign({}, f.properties)
                    });    
                }
            }  
        }); 
        return features;
    }

    makeWayGeom(vertices, width=1) {
        return new OsmWay(vertices, width).geometry;
    }
}

module.exports = OsmLoader;
