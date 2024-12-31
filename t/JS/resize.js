function resizeContainer() {
  const minAspectRatio = 9 / 16;
  const maxAspectRatio = 6 / 13;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  //for screen safe
  const screenSafe = document.querySelector(".screen_safe_area");
  let screenSafeWidth, screenSafeHeight;

  if (windowWidth < windowHeight * minAspectRatio) {
    screenSafeWidth = windowWidth;
    screenSafeHeight = windowWidth / 2;
  } else {
    screenSafeHeight = windowHeight;
    screenSafeWidth = windowHeight * 2;
  }

  screenSafe.style.width = `${screenSafeWidth}px`;

  //const promptContainer = document.querySelector("#prompt-container");
  const heightBasedWidth = windowHeight * minAspectRatio;
  const widthBasedHeight = windowWidth / maxAspectRatio;

  if (heightBasedWidth <= windowWidth) {
    //promptContainer.style.width = `${heightBasedWidth}px`;
    //promptContainer.style.height = `${windowHeight}px`;
  } else {
    if (windowWidth >= widthBasedHeight) {

      //promptContainer.style.width = `${windowWidth}px`;
      //promptContainer.style.height = `${heightBasedWidth / minAspectRatio}px`;

    } else {
      //promptContainer.style.width = `${windowWidth}px`;
      if (widthBasedHeight <= windowHeight) {
        //promptContainer.style.height = `${widthBasedHeight}px`;

      } else {
        //promptContainer.style.height = `${windowHeight}px`;
      }
    }
  }
  //font size setting for responsive sizing
  let newFontSize = (13.333 / 100) * screenSafe.clientWidth;
  //promptContainer.style.fontSize = `${newFontSize}px`;
}
resizeContainer();
window.addEventListener("load", resizeContainer);
window.addEventListener("resize", resizeContainer);
window.addEventListener("pageshow", resizeContainer);
window.addEventListener("visibilitychange", resizeContainer);
window.addEventListener("orientationchange", resizeContainer);


function resizeCanvas() {
  // Define the aspect ratios for landscape
  const minAspectRatio = 16 / 9;
  const maxAspectRatio = 13 / 6;

  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  //const promptContainer = document.querySelector("#prompt-container");
  const canvas = document.querySelector("#unity-canvas");

  const heightBasedWidth = windowHeight * minAspectRatio;
  const widthBasedHeight = windowWidth / maxAspectRatio;

  if (heightBasedWidth <= windowWidth) {
    //promptContainer.style.width = `${heightBasedWidth}px`;
    //promptContainer.style.height = `${windowHeight}px`;
    canvas.style.width = `${windowWidth}px`; //CHANGED
    canvas.style.height = `${windowHeight}px`;
  } else {
    if (windowWidth >= widthBasedHeight) {
     // promptContainer.style.width = `${windowWidth}px`;
      //promptContainer.style.height = `${widthBasedHeight}px`;
      canvas.style.width = `${windowWidth}px`;
      canvas.style.height = `${windowHeight}px`; //CHANGE
    } else {
      //promptContainer.style.width = `${windowWidth}px`;
      //promptContainer.style.height = `${windowHeight}px`;
      canvas.style.width = `${windowWidth}px`;
      canvas.style.height = `${windowHeight}px`;
    }
  }
}

resizeCanvas();
window.addEventListener("load", resizeCanvas);
window.addEventListener("resize", resizeCanvas);
