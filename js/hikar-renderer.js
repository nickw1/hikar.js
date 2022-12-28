
module.exports = AFRAME.registerComponent('hikar-renderer', {
    schema: {
        position: {
            type: 'vec2'
        },

        snapToGround: {
            type: 'boolean',
            default: true
        }
    },

    init: function() {
        const camera = this.el.sceneEl.querySelector('[gps-new-camera]'); 
        this.el.addEventListener('terrarium-dem-loaded', async(e) => {
            this.el.emit('hikar-status-change', { 
                status: "Loading OSM data...",
                statusCode: 2
            });
        });

        this.el.addEventListener('terrarium-start-update', e=> {
            this.el.emit('hikar-status-change', {
                status: "Loading elevation data...",        
                statusCode: 1
            });
        });


        this.el.addEventListener('osm-data-loaded', e=> {
            this.el.emit('hikar-status-change', { 
                status: "",
            });
            if(camera.components['gps-new-camera']) {
                e.detail.pois.forEach ( poi => {
                    if(poi.properties.name !== undefined) {
                        const text = document.createElement('a-text');
                        text.setAttribute('value', poi.properties.name);
                        text.setAttribute('font', "assets/Roboto-Regular-msdf.json");
                        text.setAttribute('font-image', "assets/Roboto-Regular.png");
                        text.setAttribute('negate', false); 
                        text.setAttribute('gps-new-entity-place', {
                            latitude: poi.geometry.coordinates[1],
                            longitude: poi.geometry.coordinates[0]
                        });
                        text.setAttribute('position', {
                            x : 0, 
                            y : poi.geometry.coordinates[2] + 10,
                            z: 0 
                        });
                        text.setAttribute('scale', {
                            x: 100,
                            y: 100,
                            z: 100
                        });
                        text.setAttribute('look-at','[gps-new-camera]');
                        this.el.appendChild(text);
                    }
                });
            } else {
                console.error('gps-new-camera not initialised yet.');
            }
        });
    },

    update: function() {
        if(this.data.position.x !== 0 || this.data.position.y !== 0) {
            this._getData(this.data.position.x, this.data.position.y);
        }
    },

    _getData: function(lon, lat) {
        this.el.setAttribute('terrarium-dem', {
            lon: lon,
            lat: lat
        });
    }

});
