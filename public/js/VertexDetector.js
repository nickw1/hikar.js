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
        this.graph = pathFinder.serialize();
    }

    findNearestVertex(p, junctionOnly = false) {
        const vertex = [ null, Number.MAX_VALUE ];

        const vertices = junctionOnly ?
            Object.keys(this.graph.vertices).filter ( k => {
                return Object.keys(this.graph.vertices[k]).length >= 3
            }) : Object.keys(this.graph.vertices);

        vertices
            .filter(k => this.graph.compactedCoordinates[k] !== undefined)
            .forEach(k => {
                const dist = turfDistance(turfPoint(p), turfPoint(this.graph.sourceVertices[k]));
                if(dist < vertex[1]) {
                    vertex[1] = dist;
                    vertex[0] = this.graph.sourceVertices[k].slice(0);
                    vertex[2] = { };
                    // Note - the compactedCoordinates do not include the destination vertex so we have to add it
                    Object.keys(this.graph.compactedCoordinates[k])
                        .forEach ( kk => {
//                            const dest = kk.split(',');
                            const dest = this.graph.sourceVertices[kk].slice(0);
                            vertex[2][kk] = {
                                coords : this.graph.compactedCoordinates[k][kk]
                                    .slice(0)
                                    .concat([[
                                        parseFloat(dest[0]), 
                                        parseFloat(dest[1])
                                ]]),
                                properties : Object.assign(
                                    {}, 
                                    this.graph.compactedEdges[k][kk]
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
    
    findEdgeWeightByKeys(c1,c2) {
        return this.graph.compactedVertices[c1] ? this.graph.compactedVertices[c1][c2]: undefined;
    }
}

module.exports = VertexDetector;
