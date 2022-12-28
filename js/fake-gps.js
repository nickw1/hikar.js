/*
 * fake-gps
 *
 * Triggers a fake GPS update event every time the camera moves a certain
 * distance, or a certain time passes.
 */

import { GoogleProjection } from 'jsfreemaplib';

AFRAME.registerComponent("fake-gps", {
    schema: {
        minDistance: {
            type: 'number',
            default: 20
        },

        minTime: {
            type: 'number',
            default: 0
        }
    },
    
    init: function() {
        this.lastPos = {
            x: this.el.object3D.position.x,
            y: this.el.object3D.position.y,
            z: this.el.object3D.position.z
        };
        this.proj = new GoogleProjection();
        this.distMoved = 0;
    },

    tick: function(totalTime, timeInterval) {
        const dx = this.el.object3D.position.x - this.lastPos.x,
              dz = this.el.object3D.position.z - this.lastPos.z;
        this.distMoved += (dx==0 && dz==0 ? 0: Math.sqrt(dx*dx + dz*dz));
        if(timeInterval >= this.data.minTime && this.distMoved >= this.data.minDistance) {
            const [lon, lat] = this.proj.unproject([
                this.el.object3D.position.x, 
                -this.el.object3D.position.z
            ]);
            console.log(`sending fake-gps event ${lon} ${lat}`);
            this.el.emit('gps-camera-update-position',{
                position: {
                    latitude: lat,
                    longitude: lon
                },
                fake: true
            });
            this.lastPos.x = this.el.object3D.position.x;
            this.lastPos.z = this.el.object3D.position.z;
            this.distMoved = 0;
        }
    }
});

