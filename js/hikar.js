/* hikar component
 *
 * The main 'orchestrator' component for Hikar.
 *
 * Automatically creates hikar-renderer and signpost-renderer components and
 * handles location updates, distinguishing between simulated and real GPS.
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
        // Set up fake-loc updates
        this.el.sceneEl.addEventListener( "fake-loc-updated", e => {
            this._doUpdate(e.detail.lon, e.detail.lat);
        });
    },

    // if lon and lat properties are provided, do a 'simulated' update
    // (one where the lon and lat are set as parameters rather than from the
    // GPS)
    update: function(oldData) {
        if(this.data.lon !== 0 && this.data.lat !== 0) {
            // create a signpost renderer, we need to do this immediately 
            // otherwise the osm-data-loaded event listener will never be
            // attached to it
            this._doUpdate(this.data.lon, this.data.lat, true, false);
        }
    },

    // Actually do the update. Signpost updating can be turned on or off
    _doUpdate: function(lon, lat, signpostUpdate = true, simulated = false) {
        this._updateHikarRenderer(lon, lat, simulated);
        if(signpostUpdate) {
            this.el.setAttribute('signpost-renderer', {
                lon: lon,
                lat: lat
            });
        }
        this.el.emit('pos-updated', {
            lon: lon,
            lat: lat
        });
    },

    _updateHikarRenderer: function(lon, lat, simulated = false) {
        this.el.setAttribute('hikar-renderer', {
                'position': {
                    x: lon, 
                    y: lat 
                }
        });
    },
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
