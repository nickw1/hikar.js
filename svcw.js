
const CACHE_NAME = 'hikarCache';
const urlsToCache = [
];

const cachableOnResponse = [
    '/fm/ws/tsvr.php',
    '/hikar.org/webapp/proxy.php'
];

self.addEventListener('install', ev=> {

    console.log('Installed the service worker...');
    ev.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache=> {
                console.log(`Opened cache ${cache}`);
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', ev=> {
    console.log('Claiming control...');
    return self.clients.claim();
});

self.addEventListener('fetch', ev=> {
    let inCache = false; 
    console.log(`Service worker intercepted: ${ev.request.url}`);
    const url = new URL(ev.request.url);
    ev.respondWith(
        caches.match(ev.request)
            .then(resp=> {

                if(resp) {
                    console.log(`This is in the service worker cache: ${url.pathname}`);
                    return resp;
                }
    
                console.log(`This is NOT in the service worker cache: ${url.pathname}`);
                return fetch(ev.request)
                    .then(resp2 => {
                        if(cachableOnResponse.indexOf(url.pathname) != -1) {
                            console.log('*** Caching this ***');
                            return caches.open(CACHE_NAME)
                                .then(cache=> {
                                    cache.put(ev.request, resp2.clone());
                                    return resp2;
                                });
                        } else {
                            console.log('Not caching this as URL does not match');
                            return resp2;
                        }
                    });
            })
    );
});
