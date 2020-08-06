require('aframe-osm-3d');
require('./hikar-renderer');
require('./vertical-controls');
require('./pinch-detector');
const jsfreemaplib = require('jsfreemaplib');
const qs = require('querystring');


window.onload = () => {
    let lastTime = 0, lastPos = { latitude: 91, longitude: 181 };

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

    const osmElement = document.getElementById('osmElement');
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
            document.getElementById('lon').innerHTML = e.detail.position.longitude.toFixed(4);
            document.getElementById('lat').innerHTML = e.detail.position.latitude.toFixed(4);
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
        });
    }
}
