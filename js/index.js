require('aframe-osm-3d');
require('./hikar-renderer');
require('./vertical-controls');
const jsfreemaplib = require('jsfreemaplib');


window.onload = () => {
    let lastTime = 0, lastPos = { latitude: 91, longitude: 181 };

    const parts = window.location.href.split('?');     
    const get = { }

    if(parts.length==2) {         
        if(parts[1].endsWith('#')) {             
            parts[1] = parts[1].slice(0, -1);         
        }         
        var params = parts[1].split('&');         
        for(var i=0; i<params.length; i++) {   
            var param = params[i].split('=');             
            get[param[0]] = param[1];         
        }     
    }    

    
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
    

    const osmElement = document.getElementById('osmElement');
    osmElement.addEventListener('hikar-status-change', e => {
        document.getElementById('status').innerHTML = e.detail.status;        
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
        });
    }
}
