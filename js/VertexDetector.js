const turfDistance = require('@turf/distance').default;
const turfPoint = require('turf-point');

/*

Note: my interpretation of the structure of the serialised graph:

compactedCoordinates:
map indexed by adjacent vertices, each entry containing
full coords along the way but NOT the destination vertex itself

compactedEdges:
the properties of each edge

compactedVertices:
the distances/weights to adjoining vertices

edgeData:
edge properties from edgeDataReduceFn

sourceVertices:
the full original non-rounded coordinates for each vertex

vertices:
distance/weights to adjoining vertices (non-compacted version)

*/

class VertexDetector {

    constructor(pathFinder) {
        this.pathFinder = pathFinder;
    }

    findNearestVertex(p, junctionOnly = false) {
        const graph = this.pathFinder.serialize();
        const vertex = [ null, Number.MAX_VALUE ];

        const vertices = junctionOnly ?
            Object.keys(graph.vertices).filter ( k => {
                return Object.keys(graph.vertices[k]).length >= 3
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
                            const dest = graph.sourceVertices[kk].slice(0);
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
