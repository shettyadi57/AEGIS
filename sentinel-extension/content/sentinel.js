// AEGIS Sentinel — Main Content Script
// Monitors all browser-level events during exam sessions

(function () {
  'use strict';

  const AEGIS = {
    active: false,
    studentId: null,
    examId: null,
    lastActivity: Date.now(),
    idleThreshold: 60000, // 60 seconds
    idleTimer: null,
    questionStartTime: Date.now(),
    questionTimes: [],
    devToolsOpen: false
  };

  // ─────────────────────────────────────────────
  // VIOLATION REPORTER
  // ─────────────────────────────────────────────
  function reportViolation(type, meta = {}) {
    chrome.runtime.sendMessage({
      type: 'VIOLATION',
      violation: type,
      meta: { ...meta, url: window.location.href }
    });
    showWarningOverlay(type);
  }

  // ─────────────────────────────────────────────
  // WARNING OVERLAY
  // ─────────────────────────────────────────────
  function showWarningOverlay(violationType) {
    const existing = document.getElementById('aegis-warning');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'aegis-warning';
    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      background: linear-gradient(135deg, #1a0a0a, #2d0f0f);
      border: 1px solid #EF4444;
      border-radius: 12px;
      padding: 14px 20px;
      color: #FFF;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 0 30px rgba(239,68,68,0.3), 0 4px 20px rgba(0,0,0,0.5);
      animation: aegisSlideIn 0.3s ease;
      max-width: 300px;
      backdrop-filter: blur(12px);
    `;

    const messages = {
      TAB_SWITCH: '⚠️ Tab switch detected',
      COPY_ATTEMPT: '🚫 Copy attempt blocked',
      PASTE_ATTEMPT: '🚫 Paste attempt blocked',
      DEVTOOLS_OPEN: '🔴 DevTools detected',
      RIGHT_CLICK: '🚫 Right-click disabled',
      FULLSCREEN_EXIT: '⚠️ Exit fullscreen detected',
      KEYBOARD_SHORTCUT: '🚫 Shortcut blocked',
      IDLE_DETECTED: '⏰ Idle detected',
      PRINT_SCREEN: '🚫 Screenshot blocked',
      WINDOW_RESIZE: '⚠️ Window resize detected',
      MULTIPLE_FACES: '👥 Multiple faces detected',
      NO_FACE: '👤 Face not detected',
      VOICE_DETECTED: '🎙️ Voice activity detected'
    };

    overlay.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:8px;height:8px;border-radius:50%;background:#EF4444;animation:aegisPulse 1s infinite;"></div>
        <span style="color:#EF4444;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:1px;">AEGIS ALERT</span>
      </div>
      <div style="margin-top:6px;">${messages[violationType] || `⚠️ Violation: ${violationType}`}</div>
      <div style="margin-top:4px;font-size:11px;color:#999;">${new Date().toLocaleTimeString()}</div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes aegisSlideIn {
        from { transform: translateX(120%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes aegisPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    setTimeout(() => {
      if (overlay.parentNode) overlay.remove();
    }, 4000);
  }

  // ─────────────────────────────────────────────
  // KEYBOARD MONITORING
  // ─────────────────────────────────────────────
  const BLOCKED_SHORTCUTS = [
    { key: 'c', ctrl: true, name: 'COPY_ATTEMPT' },
    { key: 'v', ctrl: true, name: 'PASTE_ATTEMPT' },
    { key: 'x', ctrl: true, name: 'CUT_ATTEMPT' },
    { key: 'a', ctrl: true, name: 'SELECT_ALL' },
    { key: 'p', ctrl: true, name: 'PRINT_ATTEMPT' },
    { key: 'u', ctrl: true, name: 'VIEW_SOURCE' },
    { key: 's', ctrl: true, name: 'SAVE_ATTEMPT' },
    { key: 'F12', ctrl: false, name: 'DEVTOOLS_OPEN' },
    { key: 'I', ctrl: true, shift: true, name: 'DEVTOOLS_OPEN' },
    { key: 'C', ctrl: true, shift: true, name: 'DEVTOOLS_OPEN' },
    { key: 'J', ctrl: true, shift: true, name: 'DEVTOOLS_OPEN' },
    { key: 'PrintScreen', ctrl: false, name: 'PRINT_SCREEN' }
  ];

  document.addEventListener('keydown', (e) => {
    if (!AEGIS.active) return;

    AEGIS.lastActivity = Date.now();
    resetIdleTimer();

    for (const shortcut of BLOCKED_SHORTCUTS) {
      const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : true;
      const shiftMatch = shortcut.shift ? e.shiftKey : (shortcut.shift === undefined ? true : !e.shiftKey);
      const keyMatch = e.key === shortcut.key || e.code === shortcut.key;

      if (keyMatch && ctrlMatch && (shortcut.shift === undefined || shiftMatch)) {
        e.preventDefault();
        e.stopPropagation();
        reportViolation(shortcut.name, { key: e.key });
        return false;
      }
    }

    // Block PrintScreen
    if (e.key === 'PrintScreen') {
      e.preventDefault();
      reportViolation('PRINT_SCREEN', {});
    }
  }, true);

  // ─────────────────────────────────────────────
  // RIGHT CLICK DISABLE
  // ─────────────────────────────────────────────
  document.addEventListener('contextmenu', (e) => {
    if (!AEGIS.active) return;
    e.preventDefault();
    reportViolation('RIGHT_CLICK', {});
  });

  // ─────────────────────────────────────────────
  // TEXT SELECTION DISABLE
  // ─────────────────────────────────────────────
  document.addEventListener('selectstart', (e) => {
    if (!AEGIS.active) return;
    e.preventDefault();
  });

  document.addEventListener('dragstart', (e) => {
    if (!AEGIS.active) return;
    e.preventDefault();
  });

  // ─────────────────────────────────────────────
  // COPY/PASTE EVENTS
  // ─────────────────────────────────────────────
  document.addEventListener('copy', (e) => {
    if (!AEGIS.active) return;
    e.preventDefault();
    const text = window.getSelection()?.toString() || '';
    reportViolation('COPY_ATTEMPT', { contentLength: text.length });
  });

  document.addEventListener('paste', (e) => {
    if (!AEGIS.active) return;
    e.preventDefault();
    reportViolation('PASTE_ATTEMPT', {});
  });

  document.addEventListener('cut', (e) => {
    if (!AEGIS.active) return;
    e.preventDefault();
    reportViolation('CUT_ATTEMPT', {});
  });

  // ─────────────────────────────────────────────
  // VISIBILITY / FOCUS
  // ─────────────────────────────────────────────
  document.addEventListener('visibilitychange', () => {
    if (!AEGIS.active) return;
    if (document.hidden) {
      reportViolation('TAB_HIDDEN', {});
    }
  });

  window.addEventListener('blur', () => {
    if (!AEGIS.active) return;
    reportViolation('WINDOW_BLUR', {});
  });

  window.addEventListener('focus', () => {
    AEGIS.lastActivity = Date.now();
  });

  // ─────────────────────────────────────────────
  // WINDOW RESIZE
  // ─────────────────────────────────────────────
  window.addEventListener('resize', () => {
    if (!AEGIS.active) return;

    const widthRatio = window.innerWidth / screen.width;
    const heightRatio = window.innerHeight / screen.height;

    if (widthRatio < 0.8 || heightRatio < 0.8) {
      reportViolation('WINDOW_RESIZE', {
        width: window.innerWidth,
        height: window.innerHeight,
        screenWidth: screen.width,
        screenHeight: screen.height,
        widthRatio: widthRatio.toFixed(2),
        heightRatio: heightRatio.toFixed(2)
      });
    }
  });

  // ─────────────────────────────────────────────
  // FULLSCREEN MONITORING
  // ─────────────────────────────────────────────
  function requestFullscreen() {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  document.addEventListener('fullscreenchange', () => {
    if (!AEGIS.active) return;
    if (!document.fullscreenElement) {
      reportViolation('FULLSCREEN_EXIT', {});
      // Re-request fullscreen
      setTimeout(requestFullscreen, 1000);
    }
  });

  // ─────────────────────────────────────────────
  // DEVTOOLS DETECTION
  // ─────────────────────────────────────────────
  function detectDevTools() {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;

    if ((widthThreshold || heightThreshold) && !AEGIS.devToolsOpen) {
      AEGIS.devToolsOpen = true;
      reportViolation('DEVTOOLS_OPEN', {
        outerWidth: window.outerWidth,
        innerWidth: window.innerWidth,
        outerHeight: window.outerHeight,
        innerHeight: window.innerHeight
      });
    } else if (!widthThreshold && !heightThreshold) {
      AEGIS.devToolsOpen = false;
    }
  }

  setInterval(detectDevTools, 1000);

  // Console detection trick
  const devToolsElement = new Image();
  Object.defineProperty(devToolsElement, 'id', {
    get: function () {
      if (AEGIS.active && !AEGIS.devToolsOpen) {
        AEGIS.devToolsOpen = true;
        reportViolation('DEVTOOLS_OPEN', { method: 'console' });
      }
    }
  });

  // ─────────────────────────────────────────────
  // IDLE DETECTION
  // ─────────────────────────────────────────────
  function resetIdleTimer() {
    clearTimeout(AEGIS.idleTimer);
    AEGIS.idleTimer = setTimeout(() => {
      if (AEGIS.active) {
        reportViolation('IDLE_DETECTED', {
          idleDuration: AEGIS.idleThreshold / 1000
        });
      }
    }, AEGIS.idleThreshold);
  }

  document.addEventListener('mousemove', () => {
    if (!AEGIS.active) return;
    AEGIS.lastActivity = Date.now();
    resetIdleTimer();
  });

  document.addEventListener('keypress', () => {
    if (!AEGIS.active) return;
    AEGIS.lastActivity = Date.now();
    resetIdleTimer();
  });

  // ─────────────────────────────────────────────
  // PAGE UNLOAD / REFRESH DETECTION
  // ─────────────────────────────────────────────
  window.addEventListener('beforeunload', (e) => {
    if (!AEGIS.active) return;
    reportViolation('PAGE_UNLOAD', {});
    e.preventDefault();
    e.returnValue = 'AEGIS: Leaving the exam page will be flagged as a violation.';
  });

  // ─────────────────────────────────────────────
  // CSS INJECTION — Disable user-select globally
  // ─────────────────────────────────────────────
  function injectStyles() {
    const style = document.createElement('style');
    style.id = 'aegis-global-styles';
    style.textContent = `
      body.aegis-active * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        user-select: none !important;
      }
      body.aegis-active input,
      body.aegis-active textarea {
        -webkit-user-select: text !important;
        user-select: text !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ─────────────────────────────────────────────
  // ACTIVATION
  // ─────────────────────────────────────────────
  chrome.runtime.sendMessage({ type: 'GET_SESSION' }, (response) => {
    if (response?.session?.active) {
      AEGIS.active = true;
      AEGIS.studentId = response.session.studentId;
      AEGIS.examId = response.session.examId;
      injectStyles();
      document.body.classList.add('aegis-active');
      resetIdleTimer();
      requestFullscreen();
    }
  });

  // Listen for activation messages
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'ACTIVATE_SENTINEL') {
      AEGIS.active = true;
      AEGIS.studentId = message.studentId;
      AEGIS.examId = message.examId;
      injectStyles();
      document.body.classList.add('aegis-active');
      resetIdleTimer();
      requestFullscreen();
    }
    if (message.type === 'DEACTIVATE_SENTINEL') {
      AEGIS.active = false;
      document.body.classList.remove('aegis-active');
      clearTimeout(AEGIS.idleTimer);
    }
  });

  console.log('[AEGIS] Sentinel content script loaded');
})();
