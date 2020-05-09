
AFRAME.registerComponent('gps-osm-data', {
    remove: function() {
        // cleaning listeners when the entity is removed from the DOM
        window.removeEventListener('osm-data-loaded', this.osmDataListener);
    },
    init: function() {
        this.originSphMerc = null;

        this.osmDataListener = (ev) => {
            var camera = document.querySelector('[gps-projected-camera]');
            if(!camera.components['gps-projected-camera']) {
                console.error('gps-projected-camera not initialised');
            } else {
                if(!this.originSphMerc) {
                    this.originSphMerc = camera.components['gps-projected-camera'].originCoordsProjected;
                }
            
                console.log(`Object3Ds on this entity:`);
                ev.detail.objectIds.forEach ( k=> {
                    this.el.object3DMap[k].geometry.translate(-this.originSphMerc[0], 0, this.originSphMerc[1]);
                });
                ev.detail.pois
                  .filter(f => f.properties.name !== undefined)
                  .forEach(f => {
                    const textEntity = document.createElement("a-text");
                    textEntity.setAttribute("value", f.properties.name);
                    textEntity.setAttribute("position", {
                        x: f.geometry[0] - this.originSphMerc[0], 
                        y: f.geometry[1] + 10,
                        z: -(f.geometry[2] - this.originSphMerc[1]), 
                    });
                    textEntity.setAttribute("scale", {
                        x: 100,
                        y: 100,
                        z: 100
                    });
                    textEntity.setAttribute("look-at", "[gps-projected-camera]");
                    this.el.appendChild(textEntity);
                });
            }
        };

        this.el.addEventListener('osm-data-loaded', this.osmDataListener);
    }
});
