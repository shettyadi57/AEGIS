// AEGIS Sentinel — Event Logger Utility
// Local logging and formatting for violation events

(function () {
  'use strict';

  window.AEGISLogger = {
    logs: [],
    maxLogs: 200,

    log(type, data = {}) {
      const entry = {
        type,
        data,
        timestamp: new Date().toISOString(),
        sessionTime: window._aegisSessionStart
          ? Math.floor((Date.now() - window._aegisSessionStart) / 1000)
          : 0
      };

      this.logs.push(entry);
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }

      // Store in extension storage
      chrome.storage.local.get('eventLog', (result) => {
        const log = result.eventLog || [];
        log.push(entry);
        const trimmed = log.slice(-200);
        chrome.storage.local.set({ eventLog: trimmed });
      });
    },

    getViolationSummary() {
      const counts = {};
      this.logs.forEach(entry => {
        counts[entry.type] = (counts[entry.type] || 0) + 1;
      });
      return counts;
    },

    clear() {
      this.logs = [];
      chrome.storage.local.set({ eventLog: [] });
    }
  };

  window._aegisSessionStart = Date.now();

  console.log('[AEGIS] Event logger initialized');
})();
