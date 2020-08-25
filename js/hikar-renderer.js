const jsfreemaplib = require('jsfreemaplib');

module.exports = AFRAME.registerComponent('hikar-renderer', {
    schema: {
        position: {
            type: 'vec2'
        },
        simulated: {
            type: 'boolean'
        }
    },

    init: function() {
        this.gettingData = false;
        this.simulatedGps = false;

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
    
        const camera = document.querySelector("a-camera");
        this.el.addEventListener('terrarium-dem-loaded', async(e) => {
            const position = camera.getAttribute("position");
            position.y = e.detail.elevation + 1.6; // account for camera being above ground
            camera.setAttribute("position", position);
            if(this.simulatedGps) {
                camera.setAttribute('gps-projected-camera', {
                    simulateLatitude: e.detail.lat,
                    simulateLongitude: e.detail.lon
                });
            }
            this.el.emit('hikar-status-change', { 
                status: "Loading OSM data..."
            });
        });

        this.el.addEventListener('osm-data-loaded', e=> {
            this.gettingData = false;
            this.simulatedGps = false;
            this.el.emit('hikar-status-change', { 
                status: ""
            });
            if(camera.components['gps-projected-camera']) {
                if(!this.originSphMerc) {
                    this.originSphMerc = camera.components['gps-projected-camera'].originCoordsProjected;
                }
                e.detail.objectIds.forEach ( id => {
                    this.el.object3DMap[id].geometry.translate(-this.originSphMerc[0], 0, this.originSphMerc[1]);
                });

                e.detail.pois.forEach ( poi => {
                    const text = document.createElement('a-text');
                    text.setAttribute('value', poi.properties.name);
                    text.setAttribute('position', {
                        x : poi.geometry[0] - this.originSphMerc[0],
                        y : poi.geometry[1] + 10,
                        z : -(poi.geometry[2] - this.originSphMerc[1])
                    });
                    text.setAttribute('scale', {
                        x: 100,
                        y: 100,
                        z: 100
                    });
                    text.setAttribute('look-at','[gps-projected-camera]');
                    this.el.appendChild(text);
                });
            } else {
                console.error('gps-projected-camera not initialised yet.');
            }
        });

        this.el.addEventListener('new-signpost', e=> {
            const signpost = e.detail.signpost.signpost;
            const world = camera.components['gps-projected-camera'].latLonToWorld(e.detail.signpost.position[1], e.detail.signpost.position[0]);
            const signpostArmEntities = [];
            Object.keys(signpost).forEach ( bearing => {
                const text = this._getRenderedText(signpost[bearing]);
                if(text !== null) {
                    console.log(`Creating arm: BEARING ${bearing}`);
                    const signpostArmEntity = document.createElement('a-entity');
                    signpostArmEntity.setAttribute('obj-model', {
                        obj: '#signpost-arm-obj'
                    });
                    signpostArmEntity.setAttribute('material', {
                        src: '#signpost-texture'
                    });

                    const scaleFactor = signpost[bearing].pois.length > 0 ? 1: 2;
                    for(let i=0; i<2; i++) {
                        const textEntity = document.createElement('a-text');
                        textEntity.setAttribute('value', text);
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
                        textEntity.setAttribute('anchor', i == 1 && scaleFactor > 1 ? 'center' : this.armTextProps[i][2]);
                        textEntity.setAttribute('width', 60);
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
        if(this.data.position.x !== 0 || this.data.position.y !== 0) {
            this.simulatedGps = this.data.simulated;
            this._getData(this.data.position.x, this.data.position.y);
        }
    },

    _getData: function(lon, lat) {
        if(this.gettingData === false) {
            this.gettingData = true;
            this.el.emit('hikar-status-change', {
                status: "Loading elevation data..."
            });
            this.el.setAttribute('terrarium-dem', {
                lon: lon,
                lat: lat
            });
        }
    },

    _getRenderedText: function(arm) {
        if(arm.pois.length > 0) {
            return arm.pois.slice(0, 3).map ( poi => `${poi.properties.name} ${poi.weight.toFixed(2)} km`).join("\n");
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
