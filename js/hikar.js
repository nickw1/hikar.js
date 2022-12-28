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

AFRAME.registerComponent("hikar", {
    schema: {
        lat: {
            type: 'number',
        },
        lon: {
            type: 'number',
        },
        snapToGround: {
            type: 'boolean',
            default: true
        }
    },
    
    init: function() {
        const camera = this.el.sceneEl.querySelector('[gps-new-camera]');
        this.el.addEventListener('elevation-available', e=> {
            if(this.data.snapToGround) {
                const position = camera.getAttribute("position");
                position.y = e.detail.elevation + 1.6; // account for camera being above ground
                camera.setAttribute("position", position);
            }
        });
    },

    update: function(oldData) {
        if(oldData.lon != this.data.lon || oldData.lat != this.data.lat) {
            this._doUpdate(this.data.lon, this.data.lat);
        }
    },

    _doUpdate: function(lon, lat, signpostUpdate = true) {
        this.el.setAttribute("hikar-renderer", {
            position: {    
                x: lon,
                y: lat
            }
        });

        if(signpostUpdate) {
            this.el.setAttribute('signpost-renderer', {
                lon: lon,
                lat: lat
            });
        }
    }
});
