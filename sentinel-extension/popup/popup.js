// AEGIS Sentinel — Popup Script

let sessionStartTime = null;
let durationTimer = null;

const $ = id => document.getElementById(id);

// ─────────────────────────────────────────────
// START MONITORING
// ─────────────────────────────────────────────
$('btnStart').addEventListener('click', async () => {
  const studentId = $('studentId').value.trim();
  const examId = $('examId').value.trim();

  if (!studentId || !examId) {
    alert('Please enter Student ID and Exam ID');
    return;
  }

  // Start session in background
  chrome.runtime.sendMessage({
    type: 'START_SESSION',
    studentId,
    examId
  }, (response) => {
    if (response?.success) {
      // Activate sentinel in current tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'ACTIVATE_SENTINEL',
            studentId,
            examId
          });
        }
      });

      sessionStartTime = Date.now();
      updateUI(true, studentId, examId);
      startDurationTimer();
    }
  });
});

// ─────────────────────────────────────────────
// STOP MONITORING
// ─────────────────────────────────────────────
$('btnStop').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'END_SESSION' }, () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'DEACTIVATE_SENTINEL' });
      }
    });

    clearInterval(durationTimer);
    sessionStartTime = null;
    updateUI(false, '', '');
  });
});

// ─────────────────────────────────────────────
// UI UPDATE
// ─────────────────────────────────────────────
function updateUI(active, studentId, examId) {
  $('statusBadge').textContent = active ? 'Active' : 'Idle';
  $('statusBadge').className = 'status-badge ' + (active ? 'active' : 'inactive');

  $('setupForm').style.display = active ? 'none' : 'block';
  $('sessionInfo').style.display = active ? 'block' : 'none';

  $('btnStart').disabled = active;
  $('btnStop').disabled = !active;

  if (active) {
    $('sessionStudent').textContent = studentId;
    $('sessionExam').textContent = examId;
  }
}

// ─────────────────────────────────────────────
// DURATION TIMER
// ─────────────────────────────────────────────
function startDurationTimer() {
  durationTimer = setInterval(() => {
    if (!sessionStartTime) return;
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    $('sessionDuration').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
  }, 1000);
}

// ─────────────────────────────────────────────
// VIOLATION COUNT UPDATE
// ─────────────────────────────────────────────
function updateViolationCount() {
  chrome.storage.local.get('violations', (result) => {
    const violations = result.violations || [];
    $('sessionViolations').textContent = violations.length;
  });
}

setInterval(updateViolationCount, 2000);

// ─────────────────────────────────────────────
// RESTORE STATE ON POPUP OPEN
// ─────────────────────────────────────────────
chrome.runtime.sendMessage({ type: 'GET_SESSION' }, (response) => {
  if (response?.session?.active) {
    const session = response.session;
    sessionStartTime = session.startTime;
    updateUI(true, session.studentId, session.examId);
    startDurationTimer();
    updateViolationCount();
  }
});
