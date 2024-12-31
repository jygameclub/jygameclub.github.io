const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const lang = urlParams.get('language');
const env = urlParams.get('env');
const hasFloat = urlParams.get('hasFloat');

var containerHolder = document.querySelector('.game-shell');
var checkLandscape = document.querySelector('#landscape');
var prompt = document.querySelector('#prompt-holder');
var promptmessage = document.querySelector('#prompt-msg');
var promptTitle = document.querySelector('#prompt-title');
var promptCode = document.querySelector('#prompt-code');
const loader = document.querySelector('.loader');
var canvas = document.querySelector('#unity-canvas');
var warningBanner = document.querySelector('#unity-warning');
var percentageSpan = document.querySelector('#percentage');
var res = document.querySelector('#loading-res');
const startLoop = true;

var canvas = document.querySelector('#unity-canvas');
var gameCanvas = document.querySelector('.game-canvas');
var versionText = document.querySelector('#version-text');

let defaultPercentage = 1;
const loadingScreen = document.getElementById('loadingScreen');
const loadingWrapper = document.getElementById('loadingWrapper');
const pinLoader = document.getElementById('pinLoader');
const container = document.getElementById('container');
const bubble = document.getElementById('bubble');
const percentage = document.getElementById('percentage');
const startOrDownloading = document.getElementById('startOrDownloading');

const downloadingResources = "Downloading Resources :";

startOrDownloading.setAttribute(
  'src',
  './TemplateData/NewLoadingAssets/startGame.png'
);

var downloadingText = document.querySelector('#downloadingText');
var downloadingResText = document.querySelector('#downloadingResText');
var downloadProgress = document.querySelector('#downloadProgress');
var downloadedValue = document.querySelector('#downloadedValue');
var downloadTotal = document.querySelector('#downloadTotal');

const errorbtn = document.querySelector('#error-btn');
const overlay = document.querySelector('#overlay');
// var build;

gameCanvas.style.display = 'none';
container.style.transform = `translateX(-${100 - defaultPercentage}%)`;
bubble.style.left = `${defaultPercentage}%`;
percentage.innerHTML = `${defaultPercentage}%`;

if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
  // Mobile device style: fill the whole browser client area with the game canvas:

  var meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content =
    'width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, shrink-to-fit=yes';
  document.getElementsByTagName('head')[0].appendChild(meta);
  //document.querySelector("#unity-container").className = "unity-mobile";
  //canvas.className = "unity-mobile";

  // To lower canvas resolution on mobile devices to gain some
  // performance, uncomment the following line:
  // config.devicePixelRatio = 1;
  // checkLandscape.className = "active-landscape"
  //build = "ASTC";
} else {
  // Desktop style: Render the game canvas in a window that can be maximized to fullscreen:
  //canvas.style.width = "1920px";
  //canvas.style.height = "1080px";
  //build = "DXT";
}

versionText.textContent = "v" + buildVersion;
var buildUrl = buildFold;
var loaderUrl = `${buildUrl}/${fileName}.loader.js`;
var config = {
    dataUrl: `${buildUrl}/${fileName}.data.br`,
    frameworkUrl: `${buildUrl}/${fileName}.framework.js.br`,
    codeUrl: `${buildUrl}/${fileName}.wasm.br`,
  streamingAssetsUrl: 'StreamingAssets',
  companyName: 'UnityFeiwin',
  productName: projectName,
  productVersion: buildVersion,
  //showBanner: unityShowBanner,
};

var script = document.createElement('script');
script.src = loaderUrl;
config.devicePixelRatio = 2;

var isAssetBundleLoading = false;
let IntervalId;
let TimeoutId;
let unityInitialized = false; // Flag to track if Unity instance has been initialized
let bundleInitialized = false; // Flag to track if Asset Bundle instance has been initialized
let stopUnity = false;
let startFakeLoading = false;
let lastPercentage = 1; // Store the last progress percentage
var totalBuildSizeInkb = 0;
let fakeLoadingStarted = false;
let fakeLoadingProgress = 0;
var deviceMemory = navigator.deviceMemory;
var isLowMemory = deviceMemory <= 3 ? 1 : 0;


