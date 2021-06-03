require('aframe-osm-3d');
require('./hikar');
require('./hikar-renderer');
require('./signpost-renderer');
require('./vertical-controls');
require('./pinch-detector');
const jsfreemaplib = require('jsfreemaplib');
const qs = require('querystring');

require('./fake-loc');

/* index.js
 *
 * The onload function carries out non-3D stuff, e.g. service worker management,
 * query string processing, HUD updates, etc...
 *
 * Handles events emitted by the various A-Frame components.
 */

window.onload = () => {
    let state = 0, lastTime = 0, lastPos = { latitude: 91, longitude: 181 };
    const parts = window.location.href.split('?');     
    const get = parts.length === 2 ? qs.parse(parts[1]): { };

    if('serviceWorker' in navigator) {
        navigator.serviceWorker.register('svcw.js')
            .then(registration => {
                let serviceWorker;
                if(registration.installing) {
                    serviceWorker = registration.installing;
                } else if (registration.waiting) {
                    serviceWorker = registration.waiting;
                } else if (registration.active) {
                    serviceWorker = registration.active;
                }

            })

            .catch(e => {
                console.error(`Service worker registration failed: ${e}`);
            });    
    }
    
    const camera = document.querySelector('a-camera');
    document.getElementById('fov').innerHTML = camera.getAttribute('fov');

    const hikarElement = document.querySelector('a-hikar');
    hikarElement.addEventListener('hikar-status-change', e => {
        if(e.detail.conditionalUpdate !== true || state === 0) {
            document.getElementById('status').innerHTML = e.detail.status;        
        }
        if(e.detail.statusCode !== undefined) state = e.detail.statusCode;
    });    

    hikarElement.addEventListener('nw-pinch', e => {
        const fov = parseFloat(camera.getAttribute('fov')) + e.detail.direction * 10;
        camera.setAttribute('fov', fov);
        document.getElementById('fov').innerHTML = fov; 
    });


    if(get.lat && get.lon) {
        const components = hikarElement.components;

        // if we have a query string, append a fake-loc component to the camera
        // so we can move around using WASD
        camera.setAttribute('fake-loc', true);
        camera.setAttribute('gps-projected-camera', {
            simulateLatitude: get.lat,
            simulateLongitude: get.lon
        });
        hikarElement.setAttribute('lon', parseFloat(get.lon));
        hikarElement.setAttribute('lat', parseFloat(get.lat));
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
                hikarElement.setAttribute('lon', e.detail.position.longitude);
                hikarElement.setAttribute('lat', e.detail.position.latitude);
            }
        });
    } 
    
    hikarElement.addEventListener('elevation-available', e=> {
        document.getElementById('alt').innerHTML = Math.round(e.detail.elevation);
    });

    hikarElement.addEventListener('pos-updated', e=> {
        document.getElementById('lon').innerHTML = e.detail.lon.toFixed(4);
        document.getElementById('lat').innerHTML = e.detail.lat.toFixed(4);
    });
}
