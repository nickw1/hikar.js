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
            const signpostEntity = document.createElement('a-entity');
            const signpostPostEntity = document.createElement('a-entity');
            const world = camera.components['gps-projected-camera'].latLonToWorld(e.detail.signpost.position[1], e.detail.signpost.position[0]);
            signpostPostEntity.setAttribute('obj-model', {
                obj: '#signpost-obj'
            });
            signpostPostEntity.setAttribute('material', {
                src: '#signpost-texture'
            });
            Object.keys(signpost).forEach ( bearing => {
                if(signpost[bearing].properties.highway != 'service' || 
                    signpost[bearing].pois.length > 0 || [
                        'yes', 
                        'designated', 
                        'permissive'
                    ].indexOf(signpost[bearing].foot) >= 0 || [
                        'public_footpath', 
                        'public_bridleway', 
                        'restricted_byway', 
                        'byway_open_to_all_traffic'
                    ].indexOf(signpost[bearing].properties.designation) >= 0) {
                    console.log(`Creating arm: BEARING ${bearing}`);
                    const signpostArmEntity = document.createElement('a-entity');
                    signpostArmEntity.setAttribute('obj-model', {
                        obj: '#signpost-arm-obj'
                    });
                    signpostArmEntity.setAttribute('material', {
                        src: '#signpost-texture'
                    });
                    // In model, arm points along positive z
                    let glBearing = -(parseFloat(bearing) - 180); 
                    signpostArmEntity.setAttribute('rotation', {
                        x: 0,
                        y: glBearing, 
                        z: 0
                    });
                    signpostEntity.appendChild(signpostArmEntity);
                }
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
            this.el.appendChild(signpostEntity);
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
    }
});
