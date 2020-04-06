
AFRAME.registerComponent('gps-vector-ways', {
    remove: function() {
        // cleaning listeners when the entity is removed from the DOM
        window.removeEventListener('vector-ways-loaded', this.vectorWaysListener);
    },
    init: function() {
        this.originSphMerc = null;

        this.vectorWaysListener = (ev) => {
            var camera = document.querySelector('[gps-projected-camera]');
            if(!camera.components['gps-projected-camera']) {
                consoleerror('gps-projected-camera not initialised');
            } else {
                if(!this.originSphMerc) {
                    this.originSphMerc = camera.components['gps-projected-camera'].originCoordsProjected;
                }
            
                console.log(`Object3Ds on this entity:`);
                ev.detail.objectIds.forEach ( k=> {
                    this.el.object3DMap[k].geometry.translate(-this.originSphMerc[0], 0, this.originSphMerc[1]);
                });
            }
        };

        this.el.addEventListener('vector-ways-loaded', this.vectorWaysListener);
    }
});
