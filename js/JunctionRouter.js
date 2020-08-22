// JunctionRouter 
//
// Wraps GeoJSON Path Finder (https://github.com/perliedman/geojson-path-finder)
// to provide routes to a set of POIs using a given GeoJSON network.
//
// Focuses on the ability to calculate and group routes from junctions to POIs
// (e.g. for creating signposts showing the direction and distance to POIs in
// Hikar, or for calculating routes to panoramas in OpenTrailView)
//
// This is based on the original PanoNetworkMgr from OpenTrailView, altered to 
// be more generic (e.g. use in Hikar). It does the following:
// - Takes in a network of GeoJSON
// - Inserts POIs into it (these can be panoramas, or actual POIs, etc)
// - Routes to each POI
// - Groups and returns routes
//
// Requires bugfixed geojson-path-finder; bundled here 
// (also at https://github.com/nickw1/geojson-path-finder); PR to main repo
// pending

const jsFreemaplib = require('jsfreemaplib');
const PathFinder = require('./geojson-path-finder'); 
const BoundingBox = jsFreemaplib.BoundingBox;
const VertexDetector = require('./VertexDetector');
const turfPoint = require('turf-point');
const turfBearing = require('@turf/bearing').default;


class JunctionRouter {

    constructor(options = { }) {
        this.distThreshold = options.distThreshold || 0.02;
        this.poiDistThreshold = options.poiDistThreshold || 0.1;
    }

    // Update with new geojson before attempting to route
    update(geojson, pois) {
        geojson = this.insertIntoNetwork(geojson, pois);
        this.pathFinder = new PathFinder(geojson, { 
            precision: 0.00001,    
            edgeDataReduceFn: (seed, props) => {
                return {
                    highway: props.highway,
                    isAccessiblePath: ([
                        'footway', 
                        'bridleway', 
                        'cycleway', 
                        'path', 
                        'steps', 
                        'service', 
                        'track'
                    ].indexOf(props.highway) >= 0 && 
                        props.access != 'private' &&
                        props.foot != 'private') || [
                        'public_footpath', 
                        'public_bridleway', 
                        'byway_open_to_all_traffic', 
                        'restricted_byway'
                    ].indexOf(props.designation) >= 0 
                }
            }
        } );
        this.vDet = new VertexDetector(this.pathFinder);
    }

    // is a given point a junction?
    // will trigger routing for some applications, e.g. Hikar
    isJunction(p) {
        const junc = this.vDet.findNearestVertex(p, true);
        return junc[1] < this.distThreshold ? [junc[0], junc[2]]: false;
    }

    // Input:
    //     curPt: the current point to route from
    //     pois: the list of POIs (JSON)
    //     options: whether to snap initial point to junction and/or
    //     final point to nearest vertex
    route (curPt, pois, options = {}) {
        const includedNearbys = [];


        // NEW - once we've created the graph, snap the current and nearby panos to the nearest junction within 5m, if there is one
        const snappedNodes = [ curPt, null ];
        if(options.snapToJunction) {
            snappedNodes[0] = this.vDet.snapToVertex(curPt, this.distThreshold, true);
        }
        pois.forEach(p => {
            p.lon = parseFloat(p.lon);
            p.lat = parseFloat(p.lat);
            console.log(`Routing to POI ${p.properties.name} at ${p.lon},${p.lat}`);
            p.bearing = 720;
            snappedNodes[1] = options.snapPois ? this.vDet.snapToVertex([p.lon, p.lat], this.poiDistThreshold, false) : [p.lon, p.lat];
                        
            const route = this.calcPath(snappedNodes);

            if(route!=null && route.path.length>=2 && route.edgeDatas[0].reducedEdge.isAccessiblePath) {
                console.log(`Route ${JSON.stringify(route)}`);
                // Initial bearing of the route (for OTV arrows, Hikar signposts, etc) - rounded to nearest degree
                let bearing = Math.round(
                    turfBearing(
                        turfPoint(route.path[0]), 
                        turfPoint(route.path[1])
                    )
                );

                if(bearing < 0) bearing += 360;
                p.bearing = bearing;
                p.weight = route.weight;

                // save the path so we can do something with it 
                p.path = route.path;
            }
        });
        // Sort routes to each POI based on bearing
        const sorted = pois.filter( p => p.bearing<=360).sort((p1,p2)=>(p1.bearing-p2.bearing)); 
        let lastBearing = 720;
        let curPOIsForThisBearing = [];
        const poisGroupedByBearing = [];
        
        for(let i=0; i<sorted.length; i++) {
            // group by integer bearings
            if(sorted[i].bearing != lastBearing) { // Math.abs(sorted[i].bearing-lastBearing) >= 1) {
                // new bearing
                curPOIsForThisBearing = {
                    bearing: sorted[i].bearing,
                    pois: []
                };
                poisGroupedByBearing.push(curPOIsForThisBearing);
            }
            curPOIsForThisBearing.pois.push({
                weight: sorted[i].weight,
                path: sorted[i].path,
                properties: sorted[i].properties
            });
            lastBearing = sorted[i].bearing;
        }

        // Return value: an array of pois grouped by bearing and
        // sorted by distance within each bearing group.
        // This could be used to generate a virtual signpost (Hikar) or
        // select the immediately linked panorama (OTV)
        const poisGroupedByBearingSortedByDistance = poisGroupedByBearing.map ( forThisBearing => { return { bearing: forThisBearing.bearing, pois: forThisBearing.pois.sort((n1, n2) => n1.weight - n2.weight)}});
        return poisGroupedByBearingSortedByDistance;    
    }


    insertIntoNetwork (json, pois) {
        const newFeatures = [];
        let k = 0, z = 0;
        json.features.forEach( way => { way.bbox = jsFreemaplib.getBoundingBox(way.geometry.coordinates); });
        pois.forEach(poi => {
            const point = [poi.lon, poi.lat];
            poi.overallLowestDist= { distance: Number.MAX_VALUE };
            json.features.filter(way => way.bbox.contains(point)).forEach(way => {
                
                let lowestDist = {distance: Number.MAX_VALUE}, idx = -1, curDist;
                for(let j=0; j<way.geometry.coordinates.length-1; j++) {
                    curDist = jsFreemaplib.haversineDistToLine(
                            poi.lon,     
                            poi.lat, 
                            way.geometry.coordinates[j], 
                            way.geometry.coordinates[j+1]);    
                    if(curDist!==null && curDist.distance >=0 && curDist.distance < lowestDist.distance) {
                        lowestDist=curDist;
                        idx=j;
                    }
                }    

                
                if(idx >=0 && lowestDist.distance < 10.0) {
                    // it has to be within 10m of a way 
                    // We don't yet actually try and split the way though
                    // We need to ensure the POI is inserted into the
                    // CORRECT way (the closest) - aka the "panorama 16
                    // problem". So for the moment we
                    // just create an array of POTENTIAL splits for this
                    // POI, and take the one closest to a way later.
                    if(lowestDist.distance < poi.overallLowestDist.distance) {
                        poi.overallLowestDist.distance = lowestDist.distance;
                        poi.overallLowestDist.idx = idx + lowestDist.proportion;
                        poi.overallLowestDist.way = way;
                    }
                }
            }); 
        } ); 

        const allSplits = {};

        // allSplits will now contain all COUNTED splits (one split per POI),
        // indexed by way ID, so we can then go on and consider all real splits
        // for a way, as we did before.
        // don't need this now 
        pois.filter(poi => poi.overallLowestDist.distance < Number.MAX_VALUE).forEach(poi => {
            const way = poi.overallLowestDist.way;
            if(allSplits[way.properties.osm_id] === undefined) allSplits[way.properties.osm_id] = [];
            allSplits[way.properties.osm_id].push({idx: poi.overallLowestDist.idx, poi: poi, way: way});
        });

        // now we need to loop through the ways again 
        json.features.forEach ( way => {
            let splits = allSplits[way.properties.osm_id];    
            // this was originally in the ways loop
            if(splits && splits.length>0) {
                splits = splits.sort((a,b)=>a.idx-b.idx);
                let splitIdx = 0;
                const newWay = this.makeNewWay(way); 
                let i = 0;
                while (i < way.geometry.coordinates.length) {
                    newWay.geometry.coordinates.push([way.geometry.coordinates[i][0], way.geometry.coordinates[i][1]]);
                    while(splitIdx < splits.length && Math.floor(splits[splitIdx].idx) == i) {

                        newWay.geometry.coordinates.push([splits[splitIdx].poi.lon, splits[splitIdx].poi.lat, splits[splitIdx].poi.id]);
                        splitIdx++;
                    }
                    i++;    
                }
                newFeatures[k++] = newWay;
            } else {
                newFeatures[k++] = way;
            }
        });
        json.features = newFeatures;
        return json;
    }

    calcPath (points) {

        const f1 = { geometry: { type: 'Point',
            coordinates: points[0] }},
            f2 = { geometry: { type: 'Point',
            coordinates: points[1] }};

        return this.pathFinder.findPath(f1, f2);
    }

    makeNewWay(way) {
        const newWay = {type:'Feature'};
        newWay.properties =  way.properties; 
        newWay.geometry = {};
        newWay.geometry.type =  'LineString';
        newWay.geometry.coordinates = [];
        return newWay;
    }
}

module.exports = JunctionRouter;
