// AEGIS Sentinel — Face Monitor
// Uses WebRTC + Canvas-based face detection heuristics

(function () {
  'use strict';

  const FaceMonitor = {
    active: false,
    stream: null,
    video: null,
    canvas: null,
    ctx: null,
    intervalId: null,
    consecutiveNoFace: 0,
    consecutiveMultiFace: 0,
    alertThreshold: 3,
    checkInterval: 2000, // Check every 2 seconds
    lastAlert: {}
  };

  function reportViolation(type, meta = {}) {
    const now = Date.now();
    // Debounce: don't report same violation within 10 seconds
    if (FaceMonitor.lastAlert[type] && now - FaceMonitor.lastAlert[type] < 10000) return;
    FaceMonitor.lastAlert[type] = now;

    chrome.runtime.sendMessage({
      type: 'VIOLATION',
      violation: type,
      meta
    });
  }

  async function initCamera() {
    try {
      FaceMonitor.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false
      });

      // Create hidden video element
      FaceMonitor.video = document.createElement('video');
      FaceMonitor.video.srcObject = FaceMonitor.stream;
      FaceMonitor.video.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;';
      FaceMonitor.video.autoplay = true;
      FaceMonitor.video.muted = true;
      FaceMonitor.video.playsInline = true;
      document.body.appendChild(FaceMonitor.video);

      // Create canvas for analysis
      FaceMonitor.canvas = document.createElement('canvas');
      FaceMonitor.canvas.width = 320;
      FaceMonitor.canvas.height = 240;
      FaceMonitor.ctx = FaceMonitor.canvas.getContext('2d');

      await FaceMonitor.video.play();

      // Start monitoring
      FaceMonitor.intervalId = setInterval(analyzeFrame, FaceMonitor.checkInterval);
      console.log('[AEGIS] Face monitor started');

    } catch (err) {
      console.warn('[AEGIS] Camera access denied:', err.message);
      reportViolation('CAMERA_DISABLED', { error: err.message });
    }
  }

  function analyzeFrame() {
    if (!FaceMonitor.video || FaceMonitor.video.readyState < 2) return;

    try {
      FaceMonitor.ctx.drawImage(FaceMonitor.video, 0, 0, 320, 240);
      const imageData = FaceMonitor.ctx.getImageData(0, 0, 320, 240);

      const analysis = detectFacePresence(imageData);

      if (!analysis.faceDetected) {
        FaceMonitor.consecutiveNoFace++;
        FaceMonitor.consecutiveMultiFace = 0;

        if (FaceMonitor.consecutiveNoFace >= FaceMonitor.alertThreshold) {
          reportViolation('NO_FACE', {
            consecutiveChecks: FaceMonitor.consecutiveNoFace,
            message: 'Student face not detected in camera'
          });
        }
      } else if (analysis.multipleFaces) {
        FaceMonitor.consecutiveMultiFace++;
        FaceMonitor.consecutiveNoFace = 0;

        if (FaceMonitor.consecutiveMultiFace >= FaceMonitor.alertThreshold) {
          reportViolation('MULTIPLE_FACES', {
            faceCount: analysis.estimatedFaces,
            message: 'Multiple faces detected in camera'
          });
        }
      } else {
        FaceMonitor.consecutiveNoFace = 0;
        FaceMonitor.consecutiveMultiFace = 0;
      }

      // Check for camera obstruction (very dark or very bright frame)
      if (analysis.obstructed) {
        reportViolation('CAMERA_OBSTRUCTED', {
          brightness: analysis.brightness,
          message: 'Camera appears to be obstructed'
        });
      }

    } catch (err) {
      console.error('[AEGIS] Face analysis error:', err);
    }
  }

  function detectFacePresence(imageData) {
    const data = imageData.data;
    let totalBrightness = 0;
    let skinTonePixels = 0;
    let totalPixels = data.length / 4;

    // Sample every 4th pixel for performance
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      totalBrightness += (r + g + b) / 3;

      // Skin tone detection (broad range)
      if (
        r > 95 && g > 40 && b > 20 &&
        r > g && r > b &&
        Math.abs(r - g) > 15 &&
        r - b > 15
      ) {
        skinTonePixels++;
      }
    }

    const sampledPixels = totalPixels / 4;
    const avgBrightness = totalBrightness / sampledPixels;
    const skinRatio = skinTonePixels / sampledPixels;

    const obstructed = avgBrightness < 10 || avgBrightness > 245;
    const faceDetected = skinRatio > 0.03 && !obstructed;

    // Rough multi-face detection: unusually high skin ratio
    // might indicate multiple faces visible
    const multipleFaces = skinRatio > 0.25;
    const estimatedFaces = multipleFaces ? Math.ceil(skinRatio / 0.12) : (faceDetected ? 1 : 0);

    return {
      faceDetected,
      multipleFaces,
      estimatedFaces,
      obstructed,
      brightness: Math.round(avgBrightness),
      skinRatio: skinRatio.toFixed(3)
    };
  }

  function stopCamera() {
    clearInterval(FaceMonitor.intervalId);
    if (FaceMonitor.stream) {
      FaceMonitor.stream.getTracks().forEach(t => t.stop());
    }
    if (FaceMonitor.video && FaceMonitor.video.parentNode) {
      FaceMonitor.video.remove();
    }
    FaceMonitor.active = false;
    console.log('[AEGIS] Face monitor stopped');
  }

  // ─────────────────────────────────────────────
  // ACTIVATION LISTENER
  // ─────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'ACTIVATE_SENTINEL' && !FaceMonitor.active) {
      FaceMonitor.active = true;
      initCamera();
    }
    if (message.type === 'DEACTIVATE_SENTINEL') {
      stopCamera();
    }
  });

  // Check if already active
  chrome.runtime.sendMessage({ type: 'GET_SESSION' }, (response) => {
    if (response?.session?.active && !FaceMonitor.active) {
      FaceMonitor.active = true;
      initCamera();
    }
  });

})();
