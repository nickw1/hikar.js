const JunctionRouter = require('./JunctionRouter');
const GoogleProjection = require('jsfreemaplib').GoogleProjection;
const turfDistance = require('@turf/distance').default;
const turfPoint = require('turf-point');
const turfBearing = require('@turf/bearing').default;


class SignpostManager {
    constructor(options = {}) {
        this.jr = new JunctionRouter({ distThreshold: 0.02 });
        this.sphMerc = new GoogleProjection();
        this.signposts = { };
        this.lastPos = [-181, -91];
        this.juncDetectDistChange = options.juncDetectDistChange || 0.005;
    }

    update(ways, pois) {
        const unprojWays = {
            type: 'FeatureCollection'
        };
        unprojWays.features = ways.map ( f => { 
            return {
                type: 'Feature',
                properties: Object.assign({}, f.properties),
                geometry: {
                    type: 'LineString',
                    coordinates: f.geometry.coordinates.map ( coord => this.sphMerc.unproject(coord).concat(coord[2]))
                }
            }
        });
        this.pois = pois.map ( f => {
            return {
                properties: Object.assign({}, f.properties),
                lon: this.sphMerc.googleToLon(f.geometry[0]),
                lat: this.sphMerc.googleToLat(f.geometry[2])
            };
        });
        this.jr.update(unprojWays, this.pois);
    }

    updatePos(p) {
        const tp = turfPoint(p);
        // Only try to detect a junction if we've moved a certain distance
        if(!this.jr.hasData() || turfDistance(tp, turfPoint(this.lastPos)) < this.juncDetectDistChange) {
            return null;
        } 
        this.lastPos = [p[0], p[1]];
        const j = this.jr.isJunction(p);
        if(j) {
            const jKey = `${j[0][0].toFixed(5)},${j[0][1].toFixed(5)}`;
            console.log(`**** JUNCTION **** key=${jKey}`);
            if(this.signposts[jKey]) {
                console.log('This junction already exists - not doing anything else');
                return null; // existing signpost present 
            } else {
                const nearestPois = this.pois.filter ( poi => turfDistance(turfPoint([poi.lon, poi.lat]), tp) < 5);
                const groupedPois = this.jr.route(
                    j[0],     
                    nearestPois, { 
                        snapToJunction: false, 
                        snapPois: true     
                    } );
                //console.log('**** groupedPOIs: ****');
                //console.log(groupedPois);

                const curPoint = turfPoint(j[0]);
                const signpost = { };
                //console.log(JSON.stringify(Object.keys(j[1])));
                Object.keys(j[1])
                    .filter (k => j[1][k].properties.isAccessiblePath == true)
                    .forEach ( k => {
                        let bearing = Math.round(turfBearing(curPoint,turfPoint(
                            j[1][k].coords[1]
                        )));
                        if(bearing < 0) bearing += 360;
                        signpost[bearing] = { 
                            properties: j[1][k].properties,
                            pois: [ ]
                        };
                });
                groupedPois
                    .filter ( group => signpost[group.bearing] !== undefined)
                    .forEach ( group => {    
                        signpost[group.bearing].pois = group.pois.slice(0);
                });
                console.log('FINAL SIGNPOST');
                console.log(signpost);
                this.signposts[jKey] = signpost;
                return Object.keys(signpost).length > 0 ? {
                    signpost: signpost, // created a signpost - return it  
                    position: j[0]
                } : null;
            }
        }
        return null; // not a junction
    }
}

module.exports = SignpostManager;
