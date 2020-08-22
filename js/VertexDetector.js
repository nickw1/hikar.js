const turfDistance = require('@turf/distance').default;
const turfPoint = require('turf-point');

class VertexDetector {

    constructor(pathFinder) {
        this.pathFinder = pathFinder;
    }

    findNearestVertex(p, junctionOnly = false) {
        const graph = this.pathFinder.serialize();
        const vertex = [ null, Number.MAX_VALUE ];
        let nEdges;

        const vertices = junctionOnly ?
            Object.keys(graph.vertices).filter ( k => {
                nEdges = Object.keys(graph.vertices[k]).length;
                return nEdges >= 3 || nEdges == 1;
            }) : Object.keys(graph.vertices);

        vertices
            .filter(k => graph.compactedCoordinates[k] !== undefined)
            .forEach(k => {
                const dist = turfDistance(turfPoint(p), turfPoint(graph.sourceVertices[k]));
                if(dist < vertex[1]) {
                    vertex[1] = dist;
                    vertex[0] = graph.sourceVertices[k].slice(0);
                    vertex[2] = { };
                    // Note - the compactedCoordinates do not include the destination vertex so we have to add it
                    Object.keys(graph.compactedCoordinates[k])
                        .forEach ( kk => {
                            const dest = kk.split(',');
                            vertex[2][kk] = {
                                coords : graph.compactedCoordinates[k][kk]
                                    .slice(0)
                                    .concat([[
                                        parseFloat(dest[0]), 
                                        parseFloat(dest[1])
                                ]]),
                                properties : Object.assign(
                                    {}, 
                                    graph.compactedEdges[k][kk]
                                )
                        };
                    });
                }
        });
        return vertex;
    }

    snapToVertex(p, distThreshold, junctionOnly = false) {
        const p2 =  p.slice(0);
        const junction = this.findNearestVertex(p, junctionOnly);
        if(junction[1] < distThreshold) {
            p2[0] = junction[0][0];
            p2[1] = junction[0][1];
        }
        return p2;
    }
}

module.exports = VertexDetector;
