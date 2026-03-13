// AEGIS Sentinel — Voice Monitor
// Uses Web Audio API to detect voice activity and background conversation

(function () {
  'use strict';

  const VoiceMonitor = {
    active: false,
    stream: null,
    audioContext: null,
    analyser: null,
    microphone: null,
    intervalId: null,
    silenceCount: 0,
    voiceCount: 0,
    sustainedVoiceCount: 0,
    voiceThreshold: 30, // dB threshold for voice detection
    backgroundThreshold: 55, // dB threshold for background conversation
    lastAlert: {},
    debounceMs: 15000 // 15 seconds between same alerts
  };

  function reportViolation(type, meta = {}) {
    const now = Date.now();
    if (VoiceMonitor.lastAlert[type] && now - VoiceMonitor.lastAlert[type] < VoiceMonitor.debounceMs) return;
    VoiceMonitor.lastAlert[type] = now;

    chrome.runtime.sendMessage({
      type: 'VIOLATION',
      violation: type,
      meta
    });
  }

  async function initMicrophone() {
    try {
      VoiceMonitor.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        },
        video: false
      });

      VoiceMonitor.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      VoiceMonitor.analyser = VoiceMonitor.audioContext.createAnalyser();
      VoiceMonitor.analyser.fftSize = 256;
      VoiceMonitor.analyser.smoothingTimeConstant = 0.8;

      VoiceMonitor.microphone = VoiceMonitor.audioContext.createMediaStreamSource(VoiceMonitor.stream);
      VoiceMonitor.microphone.connect(VoiceMonitor.analyser);

      VoiceMonitor.intervalId = setInterval(analyzeAudio, 1000);
      console.log('[AEGIS] Voice monitor started');

    } catch (err) {
      console.warn('[AEGIS] Microphone access denied:', err.message);
      reportViolation('MICROPHONE_DISABLED', { error: err.message });
    }
  }

  function analyzeAudio() {
    if (!VoiceMonitor.analyser) return;

    const bufferLength = VoiceMonitor.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    VoiceMonitor.analyser.getByteFrequencyData(dataArray);

    // Calculate RMS volume
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / bufferLength);
    const db = 20 * Math.log10(rms / 255) + 100; // Normalize to 0-100 range

    // Voice frequency range analysis (300Hz - 3400Hz for speech)
    const voiceStartBin = Math.floor(300 / (VoiceMonitor.audioContext.sampleRate / 2) * bufferLength);
    const voiceEndBin = Math.floor(3400 / (VoiceMonitor.audioContext.sampleRate / 2) * bufferLength);

    let voiceSum = 0;
    for (let i = voiceStartBin; i < voiceEndBin && i < bufferLength; i++) {
      voiceSum += dataArray[i];
    }
    const voiceAvg = voiceSum / (voiceEndBin - voiceStartBin);
    const voiceDb = 20 * Math.log10(voiceAvg / 255) + 100;

    // Detection logic
    if (voiceDb < VoiceMonitor.voiceThreshold) {
      VoiceMonitor.silenceCount++;
      VoiceMonitor.voiceCount = 0;
      VoiceMonitor.sustainedVoiceCount = 0;
    } else {
      VoiceMonitor.silenceCount = 0;
      VoiceMonitor.voiceCount++;

      // Sustained voice (3+ consecutive seconds)
      if (VoiceMonitor.voiceCount >= 3) {
        VoiceMonitor.sustainedVoiceCount++;

        if (voiceDb > VoiceMonitor.backgroundThreshold) {
          reportViolation('BACKGROUND_CONVERSATION', {
            db: voiceDb.toFixed(1),
            duration: VoiceMonitor.voiceCount,
            message: 'Possible background conversation detected'
          });
        } else {
          reportViolation('VOICE_DETECTED', {
            db: voiceDb.toFixed(1),
            duration: VoiceMonitor.voiceCount,
            message: 'Voice activity detected'
          });
        }
      }
    }

    // Microphone muted detection: no signal at all
    if (rms < 0.5 && VoiceMonitor.silenceCount > 30) {
      reportViolation('MICROPHONE_MUTED', {
        silenceDuration: VoiceMonitor.silenceCount,
        message: 'Microphone appears to be muted or disconnected'
      });
    }
  }

  function stopMicrophone() {
    clearInterval(VoiceMonitor.intervalId);
    if (VoiceMonitor.microphone) {
      VoiceMonitor.microphone.disconnect();
    }
    if (VoiceMonitor.audioContext) {
      VoiceMonitor.audioContext.close();
    }
    if (VoiceMonitor.stream) {
      VoiceMonitor.stream.getTracks().forEach(t => t.stop());
    }
    VoiceMonitor.active = false;
    console.log('[AEGIS] Voice monitor stopped');
  }

  // ─────────────────────────────────────────────
  // ACTIVATION LISTENER
  // ─────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'ACTIVATE_SENTINEL' && !VoiceMonitor.active) {
      VoiceMonitor.active = true;
      initMicrophone();
    }
    if (message.type === 'DEACTIVATE_SENTINEL') {
      stopMicrophone();
    }
  });

  chrome.runtime.sendMessage({ type: 'GET_SESSION' }, (response) => {
    if (response?.session?.active && !VoiceMonitor.active) {
      VoiceMonitor.active = true;
      initMicrophone();
    }
  });

})();
