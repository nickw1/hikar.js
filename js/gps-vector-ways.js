const GoogleProjection = require('./GoogleProjection');

AFRAME.registerComponent('gps-vector-ways', {
    remove: function() {
        // cleaning listeners when the entity is removed from the DOM
        window.removeEventListener('vector-ways-loaded', this.vectorWaysListener);
    },
    init: function() {
        this.sphMerc = new GoogleProjection();
        this.originSphMerc = null;

        // origin lat/lon position as sphMerc 
        // subtract sphMerc...
        this.vectorWaysListener = (ev) => {
            console.log(`vectorWaysListener... got ${ev.detail.features.length} features.`);
            var camera = document.querySelector('[gps-camera]');
            if (!camera.components['gps-camera']) {
                console.error('gps-camera not initialized');
            } else { 
                if (!this.originSphMerc) {
                    const gpsc = camera.components['gps-camera'];
                    console.log(`originCoords: ${JSON.stringify(gpsc.originCoords)}`);
                    this.originSphMerc = this.sphMerc.project(gpsc.originCoords.longitude, gpsc.originCoords.latitude);
                }
            
                ev.detail.features.forEach ( (f) => {
                    f.geometry.translate(-this.originSphMerc[0], 0, this.originSphMerc[1]);
					console.log(JSON.stringify(f));
                    var mesh = new THREE.Mesh(f.geometry, new THREE.MeshBasicMaterial( { color: f.properties.color } ));
                    this.el.setObject3D(f.properties.id, mesh);
                });
            }
        };

        window.addEventListener('vector-ways-loaded', this.vectorWaysListener);
    }
});
