require('aframe-osm-3d');
require('./hikar-renderer');
require('./vertical-controls');
require('./pinch-detector');
const SignpostManager = require('./SignpostManager');
const jsfreemaplib = require('jsfreemaplib');
const qs = require('querystring');

require('./fake-loc');

let sMgr, osmElement, osmHasLoaded = false;
 
window.onload = () => {
    let lastTime = 0, lastPos = { latitude: 91, longitude: 181 };

    const parts = window.location.href.split('?');     
    const get = parts.length === 2 ? qs.parse(parts[1]): { };

    sMgr = new SignpostManager();

    if('serviceWorker' in navigator) {
        navigator.serviceWorker.register('svcw.js')
            .then(registration => {
                console.log('Successfully registered service worker')
                let serviceWorker;
                if(registration.installing) {
                    serviceWorker = registration.installing;
                } else if (registration.waiting) {
                    serviceWorker = registration.waiting;
                } else if (registration.active) {
                    serviceWorker = registration.active;
                }

                console.log(`PHASE: ${serviceWorker.state}`);
            })

            .catch(e => {
                console.error(`Service worker registration failed: ${e}`);
            });    
    }
    

    const camera = document.querySelector('a-camera');
    document.getElementById('fov').innerHTML = camera.getAttribute('fov');

    osmElement = document.getElementById('osmElement');
    osmElement.addEventListener('hikar-status-change', e => {
        document.getElementById('status').innerHTML = e.detail.status;        
    });    
    osmElement.addEventListener('nw-pinch', e => {
        const fov = parseFloat(camera.getAttribute('fov')) + e.detail.direction * 10;
        camera.setAttribute('fov', fov);
        document.getElementById('fov').innerHTML = fov; 
    });

    if(get.lat && get.lon) {
        osmElement.setAttribute('hikar-renderer', {
                    'position': {
                        x: parseFloat(get.lon), 
                        y: parseFloat(get.lat)
                    },
                    'simulated' : true
                });
    } else {
        window.addEventListener('gps-camera-update-position', async(e)=> {
            const curTime = new Date().getTime();
            if(curTime - lastTime > 5000 && 
                jsfreemaplib.haversineDist(
                    e.detail.position.longitude, 
                    e.detail.position.latitude, 
                    lastPos.longitude, 
                    lastPos.latitude) > 10) {
                lastTime = curTime;
                lastPos.latitude = e.detail.position.latitude;
                lastPos.longitude = e.detail.position.longitude;
                osmElement.setAttribute('hikar-renderer', {
                    'position': {
                        x: e.detail.position.longitude,
                        y: e.detail.position.latitude
                    },
                    'simulated' : false
                });
            }
            updatePos(e.detail.position.longitude, e.detail.position.latitude);
        });
    }

    // Temporarily use 'fake' lon/lat from camera position
    camera.addEventListener( "fake-loc-updated", e => {
        updatePos(e.detail.lon, e.detail.lat);
    });
    

    osmElement.addEventListener('osm-data-loaded', e=> {
        console.log('osm-data-loaded');
        osmHasLoaded = true;
    });
}

function updatePos(lon, lat) {
    document.getElementById('lon').innerHTML = lon.toFixed(4);
    document.getElementById('lat').innerHTML = lat.toFixed(4);
    if(osmHasLoaded) {
        const data = osmElement.components.osm3d.getCurrentRawData(lon, lat);
        if(data !== null) {
            alert(`Updating routing graph with ${data.ways.length} ways and ${data.pois.length} POIs.`);
            sMgr.update(data.ways, data.pois);
        }
    
        const sign = sMgr.updatePos([lon, lat]);
        if(sign !== null) {
            osmElement.emit('new-signpost', {
                signpost: sign
            });
        }
    }
}
