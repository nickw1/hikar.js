const KEY_Q = 81, KEY_Z = 90;

module.exports = AFRAME.registerComponent('vertical-controls', {
    init: function() {
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        this.vertVelocity = 0.0; 
    },

    onKeyDown: function(e) {
        this.vertVelocity = e.keyCode==KEY_Q ? 50: (e.keyCode==KEY_Z ? -50 : 0.0);
    },

    onKeyUp: function(e) {
        this.vertVelocity = 0.0;
    },

    tick: function (time, delta) {
        // m/s to km/ms
        this.el.object3D.position.add(
            new THREE.Vector3(0, this.vertVelocity*delta*0.001, 0)
        );
    }
});
