require('aframe-osm-3d');
require('./hikar-renderer');
require('./vertical-controls');
require('./pinch-detector');
const jsfreemaplib = require('jsfreemaplib');
const qs = require('querystring');

require('./fake-loc');

let osmElement, osmHasLoaded = false, worker, state = 0;
 
window.onload = () => {
    let lastTime = 0, lastPos = { latitude: 91, longitude: 181 };

    worker = new Worker('js/bundleworker.js');

    const parts = window.location.href.split('?');     
    const get = parts.length === 2 ? qs.parse(parts[1]): { };

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
        if(e.detail.statusCode !== undefined) state = e.detail.statusCode;
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
                osmElement.setAttribute('hikar-renderer', {
                    'position': {
                        x: e.detail.lon,
                        y: e.detail.lat
                    },
                    'simulated' : false
                });
        updatePos(e.detail.lon, e.detail.lat);
    });
    

    osmElement.addEventListener('osm-data-loaded', e=> {
        state = 0;
        osmHasLoaded = true;
        const data = osmElement.components.osm3d.getCurrentRawData();
        if(data !== null) {
            document.getElementById('status').innerHTML = 'Loading data for routing...';
            state = 3;
            worker.postMessage({ type: 'updateData', data: data });
        }
    });

    osmElement.addEventListener('elevation-available', e=> {
        document.getElementById('alt').innerHTML = Math.round(e.detail.elevation);
    });

    worker.onmessage = e => {
        switch(e.data.type) {
            case 'dataUpdated':
                document.getElementById('status').innerHTML = '';
                state = 0;
                break;

            case 'processingJunction':
                document.getElementById('status').innerHTML = 'Creating possible signpost...';
                break;

            case 'checkJunctionFinished': 
                if(state == 0) {
                    document.getElementById('status').innerHTML = '';
                }
                if(e.data.data !== null) {
                    osmElement.emit('new-signpost', {
                        signpost: e.data.data
                    });
                }
                break;
        }
    }
}

function updatePos(lon, lat) {
    document.getElementById('lon').innerHTML = lon.toFixed(4);
    document.getElementById('lat').innerHTML = lat.toFixed(4);
    if(osmHasLoaded) {
        worker.postMessage({ type: 'checkJunction', data: [lon, lat] });
    } else {
        console.log('osmHasLoaded is false');
    }
}
