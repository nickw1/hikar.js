
AFRAME.registerComponent('gps-vector-ways', {
    remove: function() {
        // cleaning listeners when the entity is removed from the DOM
        window.removeEventListener('vector-ways-loaded', this.vectorWaysListener);
    },
    init: function() {
        this.originSphMerc = null;

        this.vectorWaysListener = (ev) => {
            console.log(`vectorWaysListener... got ${ev.detail.features.length} features.`);
            var camera = document.querySelector('[gps-projected-camera]');
            if(!camera.components['gps-projected-camera']) {
                consoleerror('gps-projected-camera not initialised');
            } else {
                if(!this.originSphMerc) {
                    this.originSphMerc = camera.components['gps-projected-camera'].originCoordsProjected;
                }
            
                ev.detail.features.forEach ( (f) => {
                    f.geometry.translate(-this.originSphMerc[0], 0, this.originSphMerc[1]);
                    var mesh = new THREE.Mesh(f.geometry, new THREE.MeshBasicMaterial( { color: f.properties.color } ));
                    this.el.setObject3D(f.properties.id, mesh);
                });
            }
        };

        window.addEventListener('vector-ways-loaded', this.vectorWaysListener);
    }
});
