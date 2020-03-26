window.onload = function() {
    let lastTime = 0;
    window.addEventListener('gps-camera-update-position', e=> {
        const curTime = new Date().getTime();
        if(curTime - lastTime > 10000) {
            alert(`Got GPS event: ${e.detail.position.longitude} ${e.detail.position.latitude}`);
            lastTime = curTime;
        }
    });
}
