
AFRAME.registerComponent('signpost-renderer', {
    schema: {
        distThreshold: {
            type: 'number',
            default: 0.02
        },
        poiDistThreshold: {
            type: 'number',
            default: 0.1
        },
        roadCost: {
            type: 'number',
            default: 1.25
        },
        minPathProportion: {
            type: 'number',
            default: 0.5
        },
        minPathProportionOverride: {
            type: 'number',
            default: 1.5
        },
        worker: {
            type: 'string',
            default: 'js/bundleworker.js'
        },
        lat: {
            type: 'number'
        },
        lon: {
            type: 'number'
        },
        camera: {
            type: 'string',
            default: 'camera1'
        }
    },

    init: function() {
        this.worker = new Worker(this.data.worker);
        this.osmHasLoaded = false;

        const camera = this.el.sceneEl.querySelector(`#${this.data.camera}`); 
        
        this.armTextProps = [
            [-0.4, -90, 'left'],
            [0.4, 90, 'right']
        ]; 

        this.displayedRouteTypes = {
            footway : 'Path',
            path: 'Path',
            steps: 'Path (with steps)',
            bridleway: 'Bridleway',
            cycleway: 'Cycle Path',
            public_footpath: 'Public Footpath',
            public_bridleway: 'Public Bridleway',
            byway_open_to_all_traffic: 'Byway',
            restricted_byway: 'Restricted Byway'
        };
        this.worker.onmessage = e => {
            switch(e.data.type) {
                case 'dataUpdated':
                    this.el.emit('hikar-status-change', {
                        status: '',
                        statusCode: 0
                    });
                    break;

                case 'processingJunction':
                    this.el.emit('hikar-status-change', {
                        status: 'Checking for signpost...',
                    });
                    break;

                case 'checkJunctionFinished': 
                    this.el.emit('hikar-status-change', {
                        status: '',
                        conditionalUpdate: true // only blank if status 0
                    });
                    if(e.data.data !== null) {
                        this.el.emit('new-signpost', {
                            signpost: e.data.data
                        });
                    }
                    break;
            }
        };
    
        this.el.addEventListener('osm-data-loaded', e=> {
            this.el.emit('hikar-status-change', {
                status: '',
                statusCode: 0
            });
            this.osmHasLoaded = true;
            const data = e.detail.rawData;
            if(data !== null) {
                this.el.emit('hikar-status-change', {
                    status: 'Loading data for routing...',
                    statusCode: 3
                });
                this.worker.postMessage({ type: 'updateData', data: data });
            }
        });

        this.el.addEventListener('new-signpost', e=> {
            const signpost = e.detail.signpost.signpost;
            const world = camera.components['gps-projected-camera'].latLonToWorld(e.detail.signpost.position[1], e.detail.signpost.position[0]);
            const signpostArmEntities = [];
            Object.keys(signpost).forEach ( bearing => {
                const text = this._getRenderedText(signpost[bearing]);
                if(text !== null) {
                    const signpostArmEntity = document.createElement('a-entity');
                    signpostArmEntity.setAttribute('obj-model', {
                        obj: '#signpost-arm-obj'
                    });
                    signpostArmEntity.setAttribute('material', {
                        src: '#signpost-texture'
                    });

                    const scaleFactor = 12 * (signpost[bearing].pois.length > 0 ? 1.8: 2);
                    for(let i=0; i<2; i++) {
                        const textEntity = document.createElement('a-text');
                        textEntity.setAttribute('value', text);

                        // Note: font JSON and images cannot be put in A-Frame assets
                        textEntity.setAttribute('font', "assets/Roboto-Regular-msdf.json");
                        textEntity.setAttribute('font-image', "assets/Roboto-Regular.png");
                        textEntity.setAttribute('negate', false); 
                        textEntity.setAttribute('position', {
                            x : this.armTextProps[i][0], 
                            y : 23,
                            z : 2 
                        });
                        textEntity.setAttribute('rotation', {
                            x : 0, 
                            y : this.armTextProps[i][1], 
                            z : 0
                        });
                        textEntity.setAttribute('scale', {
                            x: scaleFactor,
                            y: scaleFactor,
                            z: scaleFactor 
                        });
                        textEntity.setAttribute('anchor', this.armTextProps[i][2]);
                        textEntity.setAttribute('align', this.armTextProps[i][2]);
//                        textEntity.setAttribute('width', 60);
                        textEntity.setAttribute('height', 14);
                        signpostArmEntity.appendChild(textEntity);
                    }

                    // In model, arm points along positive z
                    let glBearing = -(parseFloat(bearing) - 180); 
                    
                    signpostArmEntity.setAttribute('rotation', {
                        x: 0,
                        y: glBearing, 
                        z: 0
                    });
                    
                    signpostArmEntities.push(signpostArmEntity);
                }
            });

            if(signpostArmEntities.length > 0) {
                const signpostEntity = document.createElement('a-entity');
                const signpostPostEntity = document.createElement('a-entity');
                signpostPostEntity.setAttribute('obj-model', {
                    obj: '#signpost-obj'
                });
                signpostPostEntity.setAttribute('material', {
                    src: '#signpost-texture'
                });
                signpostEntity.appendChild(signpostPostEntity);
                signpostEntity.setAttribute('position', {
                    x: world[0],
                    y: e.detail.signpost.position[2],
                    z: world[1] 
                });
                signpostEntity.setAttribute('scale', {
                    x: 0.1, 
                    y: 0.1, 
                    z: 0.1
                });
                signpostArmEntities.forEach (armEntity => {
                    signpostEntity.appendChild(armEntity);
                });
                this.el.appendChild(signpostEntity);
            }
        });
    },

    update: function() {
        this.worker.postMessage({
            type: 'setOptions',
            data: {
                distThreshold: this.data.distThreshold,
                poiDistThreshold: this.data.poiDistThreshold,
                roadCost: this.data.roadCost,
                minPathProportion: this.data.minPathProportion,
                minPathProportionOverride: this.data.minPathProportionOverride
            }
        });

        if(this.data.lon != 0 && this.data.lat != 0 && this.osmHasLoaded === true) {
            this.worker.postMessage({ type: 'checkJunction', data: [
                this.data.lon, 
                this.data.lat
            ] });
        } 
    },

    _getRenderedText: function(arm) {
        if(arm.pois.length > 0) {
            return arm.pois.slice(0, 2).map ( poi => `${poi.properties.name.length <= 25 ? poi.properties.name : poi.properties.name.substring(0, 23) + ".."} ${poi.dist.toFixed(2)} km`).join("\n");
        } else if (arm.properties.designation) {
            return this.displayedRouteTypes[arm.properties.designation] || null;
        } else if (arm.properties.highway) {
            return ['track', 'service'].indexOf(arm.properties.highway) == -1  ?
                this.displayedRouteTypes[arm.properties.highway] || null :
                (['yes', 'designated', 'permissive']
                    .indexOf(arm.properties.foot) >= 0 ? "Route with public access": null);
        }
        return null; 
    }
});
