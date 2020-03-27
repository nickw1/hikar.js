const Terrarium = require('./terrarium');
const OSM3D = require('./osm3d');

window.onload = function() {
    let lastTime = 0;
    let first = true;
    
    const terrarium = new Terrarium({
        url: '/webapp/proxy.php?x={x}&y={y}&z={z}',
        zoom: 14
    });
    const osm3d = new OSM3D('/fm/ws/tsvr.php?x={x}&y={y}&z={z}&way=highway');
    window.addEventListener('gps-camera-update-position', async(e)=> {
        const curTime = new Date().getTime();
        if(first==true && curTime - lastTime > 10000) {
            alert(`Got GPS event: ${e.detail.position.longitude} ${e.detail.position.latitude}`);
            lastTime = curTime;
            first = false;
            const results = await terrarium.setPosition(e.detail.position.longitude, e.detail.position.latitude);
            await osm3d.loadDem(results.demData);
        }
    });
}
