function checkForAutoLoad() {
  const assetsLoaded = localStorage.getItem('webdash_assets_loaded') === 'true';
  const lastLoadTime = parseInt(localStorage.getItem('webdash_last_load_time') || '0');
  const now = Date.now();
  const hoursSinceLoad = (now - lastLoadTime) / (1000 * 60 * 60);
  if (assetsLoaded && hoursSinceLoad < 24 && window.gameCache.isCacheValid()) {
    const stats = window.gameCache.getCacheStats();
    if (stats.validEntries > 50) {
      console.log('auto loading from cache');
      return true;
    }
  }
  return false;
}
if (window.gameCache) {
  window.gameCache.init();
  const canAutoLoad = checkForAutoLoad();
  if (canAutoLoad) {
    const autoLoadIndicator = document.createElement('div');
    autoLoadIndicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #00ff00;
      color: #000;
      padding: 5px 10px;
      border-radius: 5px;
      font-family: Arial;
      font-size: 12px;
      z-index: 9999;
    `;
    autoLoadIndicator.textContent = 'turbo loading';
    document.body.appendChild(autoLoadIndicator);
    setTimeout(() => {
      if (autoLoadIndicator.parentNode) {
        autoLoadIndicator.parentNode.removeChild(autoLoadIndicator);
      }
    }, 3000);
  }
}
// Render resolution option (from PR #385 by antonfdiaz): the canvas gets renderScale x the
// game size while game, camera and input coordinates stay in game units; only drawing is
// scaled, by scaling the camera for the duration of each render call. Not installed at all
// while the scale is 1 (the default), so the default path is untouched.
function installRenderScale(game) {
  if (game._renderScaleInstalled) return;
  game._renderScaleInstalled = true;
  const renderer = game.renderer;
  const originalRender = renderer.render;
  const savedMatrix = new Float32Array(6);
  let scaleX = 1;
  let scaleY = 1;

  // after the scale manager's own resize handling, so it can't undo this for the frame
  game.events.on(Phaser.Core.Events.PRE_RENDER, () => {
    const { width, height } = game.scale.gameSize;
    const renderWidth = Math.max(1, Math.round(width * (window.renderScale || 1)));
    const renderHeight = Math.max(1, Math.round(height * (window.renderScale || 1)));
    if (game.canvas.width === renderWidth && game.canvas.height === renderHeight &&
        renderer.width === renderWidth && renderer.height === renderHeight) return;
    scaleX = renderWidth / width;
    scaleY = renderHeight / height;
    if (game.canvas.width !== renderWidth) game.canvas.width = renderWidth;
    if (game.canvas.height !== renderHeight) game.canvas.height = renderHeight;
    renderer.resize(renderWidth, renderHeight);
  });

  renderer.render = function (scene, children, camera) {
    if (scaleX === 1 && scaleY === 1) {
      return originalRender.call(this, scene, children, camera);
    }
    const matrix = camera.matrix.matrix;
    const x = camera._x;
    const y = camera._y;
    const width = camera._width;
    const height = camera._height;
    for (let i = 0; i < 6; i++) savedMatrix[i] = matrix[i];
    // [a, b, c, d, tx, ty]: scale the output x row by scaleX and the y row by scaleY
    for (let i = 0; i < 6; i += 2) {
      matrix[i] *= scaleX;
      matrix[i + 1] *= scaleY;
    }
    camera._x *= scaleX;
    camera._y *= scaleY;
    camera._width *= scaleX;
    camera._height *= scaleY;
    try {
      return originalRender.call(this, scene, children, camera);
    } finally {
      // input and gameplay keep reading the logical camera
      matrix.set(savedMatrix);
      camera._x = x;
      camera._y = y;
      camera._width = width;
      camera._height = height;
    }
  };
}

const phaserConfig = {
  type: Phaser.AUTO,
  width: screenWidth,
  height: screenHeight,
  resolution: 1,
  callbacks: {
    postBoot: (game) => {
      if (window.renderScale !== 1) installRenderScale(game);
    }
  },
  fps: {
    smoothStep: true
  },
  backgroundColor: "#000000",
  parent: document.body,
  input: {
    windowEvents: false
  },
  render: {
    powerPreference: "default",
    // "sharp" texture quality = nearest-neighbour filtering; otherwise Phaser's default (true)
    antialias: window.graphicsQuality !== "sharp"
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, GameScene]
};
const webDashersGame = new Phaser.Game(phaserConfig);

// Changes the render resolution without a reload (the Graphics popup uses this).
window.setRenderScale = (scale) => {
  if (!window.renderScaleOptions.includes(scale)) return;
  window.renderScale = scale;
  try { localStorage.setItem("gd_render_scale", String(scale)); } catch (e) {}
  if (scale !== 1) installRenderScale(webDashersGame);
};

window.clearGameCache = () => {
  if (window.gameCache) {
    window.gameCache.clearCache();
    localStorage.removeItem('webdash_assets_loaded');
    localStorage.removeItem('webdash_last_load_time');
    console.log('Game cache cleared');
    location.reload();
  }
};

window.getCacheInfo = () => {
  if (window.gameCache) {
    return window.gameCache.getCacheStats();
  }
  return null;
};
