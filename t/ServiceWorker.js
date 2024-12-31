var projectName = "Fortune Tiger"
var fileName = "Fortune Tiger"
var buildType = false;
var buildVersion = "4.4.0";
var version = 1;
var gameId = "3"; //6 is 1000, 12 is not 1000
//var hasDecimal = 1; // 0 = without decimal, 1 = with decimal;
var assetBundleLink = "https://jygameclub.github.io/t/126/9game-astc";
var verifygame = "verifygame";
//var testAPI = "https://ceshifu.sunterritory.jp/imapi/";
//var prodAPI = "https://game.game9six.com/imapi/";
var apiEndpoint;

let CacheName = `${projectName}-${buildVersion}`;
let build = "";
let buildFold = "BuildFiles";
var currentCache;
var BuyFree = 0;
var is1000 = false;
if (gameId == 6) {
    is1000 = true
}

//const CacheName = "UnityFeiwin-Olympus-0.4";
//let build = "";
//let buildFolder = "";//"BuildFiles/"


// Determine the build type based on the user agent
if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {

    console.log("ASTC");
} else {
    console.log("DXT");
}

// Define content to cache
const contentToCache = [
    `${buildFold}/${fileName}.loader.js`,
    `${buildFold}/${fileName}.framework.js.br`,
    `${buildFold}/${fileName}.data.br`,
    `${buildFold}/${fileName}.wasm.br`
];

// self.addEventListener('install', (event) => {
//     console.log('Service Worker installing.');
//     event.waitUntil(
//         caches.open(CacheName).then((cache) => {
//             return cache.addAll(contentToCache);
//         })
//     );
//     self.skipWaiting();
// });


self.addEventListener('install', (event) => {
    console.log('Service Worker installing.');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CacheName) {
                        console.log("DELETE DATA", cacheNames);
                        return caches.delete(cacheName);

                    }
                    caches.open(CacheName).then((cache) => {
                        console.log('Opened cache');
                        return cache.addAll(contentToCache);
                    })
                    clients.forEach(client => {
                        console.log("SEND TO CLIENT");
                        client.postMessage({
                            version: CacheName
                        });
                    })
                })
            );
        }),
    );

    // Perform cache cleanup and add necessary resources to the cache
    // event.waitUntil(

    //     caches.open(CacheName).then((cache) => {
    //     console.log('Opened cache');
    //     return cache.addAll(contentToCache);
    //     })
    // );

    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activating.');

    // Clean up old caches
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CacheName) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                }),
                // clients.forEach(client => {
                //     console.log("SEND TO CLIENT");
                //     client.postMessage({
                //     version: CacheName
                //     });
                // })
            );
        })
    );

    // Take control of all open clients without waiting for them to reload
    self.clients.claim();
});

// self.addEventListener('activate', (event) => {
//     console.log('Service Worker activating.');
//     event.waitUntil(
//         caches.keys().then((cacheNames) => {
//             return Promise.all(
//                 cacheNames.map((cacheName) => {
//                     if (cacheName !== CacheName) {
//                         return caches.delete(cacheName);
//                     }
//                 })
//             );
//         })
//     );
//     return self.clients.claim();
// });


self.addEventListener('fetch', function (event) {
    if (event.request.method === 'GET') {
        // Filter out requests with unsupported schemes
        if (!event.request.url.startsWith('http')) {
            return;
        }

        let result = event.request.url.includes("TemplateData");
        if (result) {
            // console.log("Returned " + event.request.url);
            return;
        }

        let result1 = event.request.url.includes("JS");
        if (result1) {
            // console.log("Returned " + event.request.url);
            return;
        }

        let result2 = event.request.url.includes("ServiceWorker");
        if (result2) {
            // console.log("Returned " + event.request.url);
            return;
        }

        event.respondWith(
            caches.match(event.request).then(function (response) {
                return response || fetch(event.request).then(function (fetchResponse) {
                    return caches.open(CacheName).then(function (cache) {
                        cache.put(event.request, fetchResponse.clone());
                        return fetchResponse;
                    });
                });
            })
        );
    }
    // else {
    //     // Handle non-GET requests here (e.g., by forwarding the request to the network)
    //     event.respondWith(
    //         fetch(event.request).catch(function() {
    //             // Handle network errors
    //         })
    //     );
    // }
});


self.addEventListener('message', function (event) {
    // console.log("Message received:", event.data);
    if (event.data === 'clearCache') {
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                console.log("Checking key:", key);
                console.log('[Service Worker] Clearing cache:', key);
                return caches.delete(key);
            })).then(() => {
                console.log('Cache cleared successfully');
                // Send a message back to the main thread
                event.ports[0].postMessage({ status: 'success' });
            }).catch(err => {
                console.error('Error clearing cache:', err);
                // Send a message back to the main thread
                event.ports[0].postMessage({ status: 'failure', error: err });
            });
        });
    }
});

