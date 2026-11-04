// editable config stuff 

if (window.mainColor == null) {
  window.mainColor = parseInt(localStorage.getItem("iconMainColor") || "04FF00", 16);
}
if (window.secondaryColor == null) {
  window.secondaryColor = parseInt(localStorage.getItem("iconSecondaryColor") || "00FBFF", 16);
}
// Graphics popup options (from PR #385 by antonfdiaz). The defaults are the original look:
// smooth (linear) texture filtering and a canvas the size of the game (renderScale 1).
window.graphicsQualityOptions = ["smooth", "sharp"];
window.renderScaleOptions = [0.3, 0.5, 0.75, 1, 1.5, 2];
(function () {
  let quality = null;
  let scale = NaN;
  try {
    quality = localStorage.getItem("gd_graphics_quality");
    scale = Number(localStorage.getItem("gd_render_scale"));
  } catch (e) {}
  window.graphicsQuality = window.graphicsQualityOptions.includes(quality) ? quality : "smooth";
  window.renderScale = window.renderScaleOptions.includes(scale) ? scale : 1;
})();
window.currentPlayer = localStorage.getItem("iconCurrentPlayer") || "player_01";
window.currentShip   = localStorage.getItem("iconCurrentShip")   || "ship_01";
window.currentBall   = localStorage.getItem("iconCurrentBall")   || "player_ball_01";
window.currentWave   = localStorage.getItem("iconCurrentWave")   || "dart_01";
window.currentSpider = localStorage.getItem("iconCurrentSpider") || "spider_01";
window.currentBird   = localStorage.getItem("iconCurrentBird")   || "bird_01";
const storedUseDirectInternet = localStorage.getItem("gd_useDirectInternet");
window.useDirectInternet = storedUseDirectInternet === null ? true : storedUseDirectInternet === "true";
window.getGdApiBase = function () {
  if (window.useDirectInternet) return "https://www.boomlings.com/database";
  return (window._gdProxyUrl || "").replace(/\/$/, "");
};
window.getGdApiUrl = function (path) {
  const base = window.getGdApiBase();
  if (!base) return null;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
};
window.fetchGdApi = async function (path, options = {}) {
  const directUrl = window.useDirectInternet ? window.getGdApiUrl(path) : null;
  const proxyBase = (window._gdProxyUrl || "").replace(/\/$/, "");
  const proxyUrl = proxyBase ? `${proxyBase}${path.startsWith("/") ? "" : "/"}${path}` : null;
  const urls = [];
  if (directUrl) urls.push(directUrl);
  if (proxyUrl && proxyUrl !== directUrl) urls.push(proxyUrl);
  let lastError = null;
  for (const url of urls) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("No GD API endpoint available");
};
window.getGdAudioUrl = function (songUrl) {
  if (window.useDirectInternet) return songUrl;
  const proxyBase = (window._gdProxyUrl || "").replace(/\/$/, "");
  return proxyBase ? `${proxyBase}/audio-proxy?url=${encodeURIComponent(songUrl)}` : songUrl;
};
window.fetchGdAudio = async function (songUrl, options = {}) {
  const directUrl = window.useDirectInternet ? songUrl : null;
  const proxyBase = (window._gdProxyUrl || "").replace(/\/$/, "");
  const proxyUrl = proxyBase ? `${proxyBase}/audio-proxy?url=${encodeURIComponent(songUrl)}` : null;
  const urls = [];
  if (directUrl) urls.push(directUrl);
  if (proxyUrl && proxyUrl !== directUrl) urls.push(proxyUrl);
  let lastError = null;
  for (const url of urls) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("No audio endpoint available");
};
window.currentlevel = [
	"stereo_madness", // internal level name
	"Stereo Madness", // proper level name
	"level_1",        // level id in assets/levels
	["RobTop", "Forever Bound"]   // person who made the song
];
window.orbClickScale = 2.0;
window.orbClickShrinkTime = 250;
window.orbParticleSize = 3.5;

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('id')) {
  window.levelID = urlParams.get('id');
}

// -------------------------------

function hexToHexadecimal(str) {
  return parseInt(str, 16);
}

function hexadecimalToHex(num) {
  return num.toString(16).padStart(6, '0');
}

let screenWidth = 1138;
const screenHeight = 640;
const a = 60;
const o = 180;
let centerX = screenWidth / 2 - 150;
function l(screenWidth) {
  this.screenWidth = screenWidth;
  centerX = screenWidth / 2 - 150;
}
const u = 1 / 240;
const SpeedPortal = {
  HALF: 9.30222544655,
  ONE_TIMES: 11.540004,
  TWO_TIMES: 14.3488938625,
  THREE_TIMES: 17.3333393414,
  FOUR_TIMES: 21.3333407279
}
let playerSpeed = SpeedPortal.ONE_TIMES;
const d = 0.9;
const p = 1.916398;
const f = 600;
const g = a;
const jumpPadType = "jump_pad";
const jumpRingType = "jump_ring";
const T = 460;
function b(y) {
  return T - y;
}
let S = Phaser.BlendModes.ADD;
let E = Phaser.BlendModes.NORMAL;

const fs = 1000;
const gs = 1001;

const atlasList = [
  "GJ_WebSheet",
  "GJ_GameSheet",
  "GJ_GameSheet02",
  "GJ_GameSheet03",
  "GJ_GameSheet04",
  "GJ_GameSheetEditor",
  "GJ_GameSheetGlow",
  "GJ_GameSheetIcons",
  "GJ_LaunchSheet",
  "player_ball_00",
  "player_dart_00",
  "GJ_ParticleSheet-uhd",
  "GJ_ParticleSheet",
  "PixelSheet_01-hd",
  "FireSheet_01-hd",
  "Wavesheet",
];
// getAtlasFrame runs for every object built and for every animation frame swap (each one
// scanning up to 16 atlases and allocating a result). The answer only changes when textures
// are added or removed, so it is remembered per texture manager until one is. Callers only
// read the returned { atlas, frame }.
const _atlasFrameLookups = new WeakMap();
function getAtlasFrame(scene, frameName) {
  const textures = scene.textures;
  let lookups = _atlasFrameLookups.get(textures);
  if (!lookups) {
    lookups = new Map();
    _atlasFrameLookups.set(textures, lookups);
    const forget = () => lookups.clear();
    textures.on(Phaser.Textures?.Events?.ADD || "addtexture", forget);
    textures.on(Phaser.Textures?.Events?.REMOVE || "removetexture", forget);
  }
  let found = lookups.get(frameName);
  if (found === undefined) {
    found = _findAtlasFrame(scene, frameName);
    lookups.set(frameName, found);
  }
  return found;
}
function _findAtlasFrame(scene, frameName) {
  if (frameName.startsWith("player_")) {
    const playerAtlasPriority = ["GJ_GameSheet03", "GJ_GameSheet", "GJ_GameSheet02", "GJ_GameSheet04", "GJ_GameSheetEditor", "GJ_GameSheetGlow", "GJ_GameSheetIcons", "GJ_WebSheet", "GJ_LaunchSheet", "player_ball_00", "player_dart_00"];
    for (let atlasName of playerAtlasPriority) {
      if (scene.textures.exists(atlasName)) {
        if (scene.textures.get(atlasName).has(frameName)) {
          return {
            atlas: atlasName,
            frame: frameName
          };
        }
      }
    }
  }
  for (let atlasName of atlasList) {
    if (scene.textures.exists(atlasName)) {
      if (scene.textures.get(atlasName).has(frameName)) {
        return {
          atlas: atlasName,
          frame: frameName
        };
      }
    }
  }
  return null;
}
function addImageToScene(scene, x, y, textureName) {
  let textureInfo = getAtlasFrame(scene, textureName);
  if (textureInfo) {
    return scene.add.image(x, y, textureInfo.atlas, textureInfo.frame);
  } else if (scene.textures.exists(textureName)) {
    return scene.add.image(x, y, textureName);
  } else {
    return null;
  }
}
