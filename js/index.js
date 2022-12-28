//import 'aframe';
//import '@ar-js-org/ar.js';
import './hikar.js';
import './hikar-renderer.js';
import './signpost-renderer.js';
import './fake-gps.js';
import './vertical-controls.js';
import * as qs from 'qs';
import 'aframe-osm-3d';

window.onload = () => {

    const parts = window.location.href.split("?");
    const get = parts.length === 2 ? qs.parse(parts[1]) : { };

    const hikarEl = document.querySelector("[hikar]");
    const cameraEl = document.querySelector("[gps-new-camera]");

    cameraEl.object3D.position.y = 100;

    if(get.fakeGps) {
        cameraEl.setAttribute("fake-gps", { });
    }

    cameraEl.addEventListener("gps-camera-update-position", e => {
        console.log("Received gps-camera-update-position");
        if(get.lat === undefined && get.lon === undefined) {
            hikarEl.setAttribute("hikar", {
                lon: e.detail.position.longitude,
                lat: e.detail.position.latitude,
                snapToGround: !e.detail.fake
            });
            document.getElementById("status").innerHTML = "Downloading elevation data...";
        }
    });

    if(get.lat !== undefined && get.lon !== undefined) {
        hikarEl.setAttribute("hikar", {
            lon: get.lon,
            lat: get.lat
        });
    }

    hikarEl.addEventListener("hikar-status-change", e => {
        document.getElementById("status").innerHTML = e.detail.status;
    });

/*
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
*/
};

