const GoogleProjection = require('jsfreemaplib').GoogleProjection;

module.exports = AFRAME.registerComponent('fake-loc', {
    init: function() {
        this.curTime = new Date().getTime();
        this.sphMerc = new GoogleProjection();
        this.lastPos = [ 0, 0 ];
    },
    tick: function() {
        const t = new Date().getTime();
        if(t - this.curTime > 2000) {
            const origin = this.el.components['gps-projected-camera'].originCoords;
            if(!origin) return;
            const dx = this.el.object3D.position.x - this.lastPos[0];
            const dz = this.el.object3D.position.z - this.lastPos[1];
            const dist = Math.sqrt(dx*dx + dz*dz);
            this.curTime = t;
            if(dist >= 1)  {
                const curPos = this.sphMerc.unproject([
                    this.el.object3D.position.x + origin[0],
                    -this.el.object3D.position.z + origin[1]
                ]);
                this.el.emit('fake-loc-updated', {
                    lon: curPos[0],
                    lat: curPos[1]
                });
                this.lastPos[0] = this.el.object3D.position.x;
                this.lastPos[1] = this.el.object3D.position.z;
            }
        }
    }
});
