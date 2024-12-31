function ReloadScene() {
    location.reload(); // reload
}

function RestartingPage(msg) {
    let index = 6;
    const interval = 1000; // 1000 milliseconds = 1 second

    function countdown() {
      if (index >= 0) {
        promptmessage.textContent = msg + "\n\n Restarting in " + index + " seconds";
        index--;

        setTimeout(countdown, interval);
      } else {
        // Restart or perform the desired action when countdown finishes
        console.log(">>> Countdown finished. Restarting now.");
        ClearCacheDataReload();
      }
    }
    countdown();
}

function ClearCacheDataReload() {
    console.log(">>> Clear data cache!");
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(function (registration) {
        if (registration.active) {
          // Create a MessageChannel
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = function (event) {
            if (event.data.status === "success") {
              console.log(">>> Cache cleared successfully, reloading page!");
              // Your callback function here
              location.reload(); // reload
            } else {
              console.error("Cache clearing failed", event.data.error);
              InvokeBugsnagError("Internal", "1002", "Cache clearing failed " + event.data.error);

            }
          };
          localStorage.clear();
          // Send the message with the port for the response
          registration.active.postMessage("clearCache", [
            messageChannel.port2,
          ]);
          console.log(">>> Message sent to service worker to clear cache");
        } else {
          InvokeBugsnagError("Internal", "1002", "Service Worker Error : Service worker is not active");
          console.log(">>> Service worker is not active");
        }
      });
    } else {

      InvokeBugsnagError("Internal", "1002", "Service Worker Error : Service worker not supported");

      console.log(">>> Service worker not supported");
    }
}

window.addEventListener("load", function () { 
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register('ServiceWorker.js').then(function (registration) {
            console.log('Service Worker registered with scope:', registration.scope);
            
            // if (registration.active) {
            //     console.log("REGISTERED WORKER", CacheName);
            // }
            var isReloaded = false;
            // Listen for messages from the service worker
            navigator.serviceWorker.addEventListener('message', event => {
                console.log('Received message from service worker:', event.data);
                // Handle the message (callback) here
                //alert(event.data.msg);
                const cacheSession = localStorage.getItem("cacheName");
                
                //if(cacheSession !== CacheName){
                    // console.log("OLD CACHE SESSION", cacheSession);
                    // localStorage.removeItem("cacheName");
                    // localStorage.setItem("cacheName", event.data.version);
                    // console.log("EVENT DATA", event.data.version);
                    // console.log("NEW CACHE SESSION", CacheName);
                //}
  
                //sessionStorage.setItem("cacheName", CacheName);
                isReloaded = true;
                getData();
                overlay.style.display = 'none';
                startFakeLoading = true;
                StartDownloadingTimeout();
            });
  
            // Function to stop caching
            function stopCaching() {
                // if (navigator.serviceWorker.controller) {
                //     navigator.serviceWorker.controller.postMessage({
                //         type: 'UPDATE_CACHE_CONTROL',
                //         shouldCache: false
                //     });
                    
                // }
                if(!isReloaded){
                    getData();
                    overlay.style.display = 'none';
                    startFakeLoading = true;
                    StartDownloadingTimeout();
                }
                
            }
            // Example usage: stop caching after some process
            someProcess().then(stopCaching);
        }).catch(function (error) {
  
            InvokeBugsnagError("Internal", "1002", "Service Worker Error : " + error);
            console.log('Service Worker registration failed:', error);
        });
    }
    // Example process after which caching should stop
    function someProcess() {
        return new Promise((resolve) => {
            // Simulate a process with a timeout
            setTimeout(resolve, 3000); // 5 seconds for demonstration
        });
    }
});
