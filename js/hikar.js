/* hikar component
 *
 * The main 'orchestrator' component for Hikar.
 *
 * Automatically creates hikar-renderer and signpost-renderer components
 * and controls interaction between the gps-projected-camera and the Hikar
 * renderer components.
 *
 * Does not do any standard '2D HTML', instead emits events which can be
 * handled by some other part of the application - index.js in the default
 * Hikar.
 *
 * Intention is that anyone can import Hikar into their own application by
 * using this component (plus AR.js, terrarium-dem and osm3d).
 */


const jsfreemaplib = require('jsfreemaplib');

AFRAME.registerComponent('hikar', {

    schema: {
        lon: {
            type: 'number'
        },

        lat: {
            type: 'number'
        }
    },

    init: function() {
        let lastTime = 0, lastPos = { latitude: 91, longitude: 181 };

        window.addEventListener('gps-camera-update-position', async(e)=> {
            const curTime = new Date().getTime();
            if(curTime - lastTime > 5000 && 
                jsfreemaplib.haversineDist(
                    e.detail.position.longitude, 
                    e.detail.position.latitude, 
                    lastPos.longitude, 
                    lastPos.latitude) > 10) {
                lastTime = curTime;
                lastPos.latitude = e.detail.position.latitude;
                lastPos.longitude = e.detail.position.longitude;
                this._doUpdate(e.detail.position.longitude, e.detail.position.latitude);
            }
        });


        this.el.sceneEl.addEventListener( "fake-loc-updated", e => {
            this._doUpdate(e.detail.lon, e.detail.lat);
        });
    },

    update: function() {
        if(this.data.lon !== 0 && this.data.lat !== 0) {
            this._doUpdate(this.data.lon, this.data.lat, false, true);
        }
    },

    _doUpdate: function(lon, lat, signpostUpdate = true, simulated = false) {
        this._updateHikarRenderer(lon, lat, simulated);
        if(signpostUpdate) {
            this._updatePos(lon, lat);
        }
    },

    _updateHikarRenderer: function(lon, lat, simulated = false) {
        this.el.setAttribute('hikar-renderer', {
                'position': {
                    x: lon, 
                    y: lat 
                },
                'simulated' : simulated
        });
    },

    _updatePos: function(lon, lat) {
        this.el.emit('pos-updated', {
            lon: lon,
            lat: lat
        });

        this.el.setAttribute('signpost-renderer', {
            lon: lon,
            lat: lat
        });
    }
});


AFRAME.registerPrimitive('a-hikar', {
    defaultComponents: {
        'hikar': { },
        'pinch-detector': { }
    },

    mappings: {
        lat: 'hikar.lat',
        lon: 'hikar.lon'
    }
});
