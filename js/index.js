
let gpsTriggered = true, gettingData = false, osmElement, simulated = false;

window.onload = () => {
    let lastTime = 0;
    gpsTriggered = true;

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

    osmElement = document.getElementById('osmElement');
    if(get.lat && get.lon) {
        getData(parseFloat(get.lon), parseFloat(get.lat), true);
    } else {
        window.addEventListener('gps-camera-update-position', async(e)=> {
            const curTime = new Date().getTime();
            if(gpsTriggered==true && curTime - lastTime > 5000) {
                lastTime = curTime;
                getData(e.detail.position.longitude, e.detail.position.latitude);
            }
        });
    }
    osmElement.addEventListener('terrarium-dem-loaded', async(e)=> {
        const camera = document.querySelector('a-camera');
        const position = camera.getAttribute('position');
        position.y = e.detail.elevation;
        camera.setAttribute('position', position);
        if(simulated) {
            gpsTriggered = false;
            camera.setAttribute('gps-projected-camera', {
                simulateLatitude: e.detail.lat,
                simulateLongitude: e.detail.lon
            });
        }
        document.getElementById('status').innerHTML = 'Loading OSM data...';
    });
    osmElement.addEventListener('vector-ways-loaded', e=> {
        document.getElementById('status').innerHTML = '';
        gettingData = false;
        simulated = false;
    });

}

function getData(lon, lat, sim=false) {
    if(!gettingData) {
        simulated = sim;
        gettingData = true;
        document.getElementById('status').innerHTML = 'Loading elevation data...';
        osmElement.setAttribute('terrarium-dem', {
            lon: lon,
            lat: lat
        });
    }
}
