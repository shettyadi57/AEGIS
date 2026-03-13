// AEGIS Sentinel — Background Service Worker
// Handles tab monitoring, communication routing, and session management

const BACKEND_URL = 'http://localhost:5000';
let sessionData = {
  studentId: null,
  examId: null,
  active: false,
  tabSwitchCount: 0,
  startTime: null
};

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    aegisSession: null,
    violations: [],
    examActive: false
  });
  console.log('[AEGIS] Sentinel installed and ready');
});

// ─────────────────────────────────────────────
// TAB MONITORING
// ─────────────────────────────────────────────
let tabSwitchStart = null;

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!sessionData.active) return;

  const now = Date.now();
  if (tabSwitchStart) {
    const duration = Math.floor((now - tabSwitchStart) / 1000);
    await sendViolation('TAB_SWITCH', { duration });
  }
  tabSwitchStart = now;
  sessionData.tabSwitchCount++;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!sessionData.active) return;
  if (changeInfo.url) {
    sendViolation('NAVIGATION_CHANGE', { url: changeInfo.url });
  }
});

// ─────────────────────────────────────────────
// MESSAGE HANDLER FROM CONTENT SCRIPTS
// ─────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'START_SESSION':
      sessionData = {
        studentId: message.studentId,
        examId: message.examId,
        active: true,
        tabSwitchCount: 0,
        startTime: Date.now()
      };
      chrome.storage.local.set({ aegisSession: sessionData, examActive: true });
      sendResponse({ success: true });
      break;

    case 'END_SESSION':
      sessionData.active = false;
      chrome.storage.local.set({ examActive: false });
      sendResponse({ success: true });
      break;

    case 'VIOLATION':
      if (sessionData.active) {
        sendViolation(message.violation, message.meta || {});
      }
      sendResponse({ received: true });
      break;

    case 'GET_SESSION':
      sendResponse({ session: sessionData });
      break;

    case 'PING':
      sendResponse({ pong: true, active: sessionData.active });
      break;
  }
  return true; // Keep message channel open for async
});

// ─────────────────────────────────────────────
// VIOLATION SENDER
// ─────────────────────────────────────────────
async function sendViolation(violationType, meta = {}) {
  if (!sessionData.studentId) return;

  const payload = {
    studentId: sessionData.studentId,
    examId: sessionData.examId,
    violation: violationType,
    timestamp: new Date().toISOString(),
    ...meta
  };

  try {
    const response = await fetch(`${BACKEND_URL}/api/violations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AEGIS-Extension': 'sentinel-v1'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn('[AEGIS] Failed to send violation:', violationType);
    }

    // Cache locally too
    const stored = await chrome.storage.local.get('violations');
    const violations = stored.violations || [];
    violations.push(payload);
    chrome.storage.local.set({ violations: violations.slice(-100) }); // Keep last 100
  } catch (err) {
    console.error('[AEGIS] Network error sending violation:', err.message);
    // Cache for later retry
    const stored = await chrome.storage.local.get('pendingViolations');
    const pending = stored.pendingViolations || [];
    pending.push(payload);
    chrome.storage.local.set({ pendingViolations: pending });
  }
}

// ─────────────────────────────────────────────
// RETRY PENDING VIOLATIONS
// ─────────────────────────────────────────────
chrome.alarms.create('retryViolations', { periodInMinutes: 0.5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'retryViolations') return;

  const stored = await chrome.storage.local.get('pendingViolations');
  const pending = stored.pendingViolations || [];
  if (pending.length === 0) return;

  const remaining = [];
  for (const payload of pending) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/violations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) remaining.push(payload);
    } catch {
      remaining.push(payload);
    }
  }

  chrome.storage.local.set({ pendingViolations: remaining });
});

// ─────────────────────────────────────────────
// WINDOW FOCUS MONITORING
// ─────────────────────────────────────────────
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (!sessionData.active) return;
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    sendViolation('WINDOW_BLUR', { timestamp: new Date().toISOString() });
  }
});
