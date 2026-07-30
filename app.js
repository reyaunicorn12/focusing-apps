// ===== FOCUS APP — app.js =====

const RING_RADIUS = 90;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ---- DOM refs ----
const body         = document.body;
const modeBadge    = document.getElementById('mode-badge');
const timerDisplay = document.getElementById('timer-display');
const ringProgress = document.getElementById('ring-progress');
const dots         = document.querySelectorAll('.dot');
const btnStart     = document.getElementById('btn-start');
const btnPause     = document.getElementById('btn-pause');
const btnReset     = document.getElementById('btn-reset');
const focusInput   = document.getElementById('focus-duration');
const breakInput   = document.getElementById('break-duration');

// ---- State ----
let totalSeconds   = 0;
let remainingSeconds = 0;
let isRunning      = false;
let isBreak        = false;
let completedSessions = 0;
let intervalId     = null;

// ---- Init ring ----
ringProgress.style.strokeDasharray  = RING_CIRCUMFERENCE;
ringProgress.style.strokeDashoffset = 0;

// ---- Helpers ----
function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateRing(remaining, total) {
  const fraction = total > 0 ? remaining / total : 1;
  const offset   = RING_CIRCUMFERENCE * (1 - fraction);
  ringProgress.style.strokeDashoffset = offset;
}

function updateDots() {
  dots.forEach((dot, i) => {
    dot.classList.toggle('done', i < completedSessions % dots.length);
  });
}

function setMode(breakMode) {
  isBreak = breakMode;
  if (breakMode) {
    body.className       = 'break-mode';
    modeBadge.textContent = '☕ Break';
    totalSeconds         = parseInt(breakInput.value, 10) * 60 || 5 * 60;
  } else {
    body.className       = 'focus-mode';
    modeBadge.textContent = '🎯 Focus';
    totalSeconds         = parseInt(focusInput.value, 10) * 60 || 25 * 60;
  }
  remainingSeconds = totalSeconds;
  timerDisplay.textContent = formatTime(remainingSeconds);
  updateRing(remainingSeconds, totalSeconds);
}

function tick() {
  if (remainingSeconds <= 0) {
    clearInterval(intervalId);
    isRunning = false;
    playBeep();

    if (!isBreak) {
      completedSessions++;
      updateDots();
    }

    // Auto-switch to next mode
    setMode(!isBreak);
    startTimer();
    return;
  }
  remainingSeconds--;
  timerDisplay.textContent = formatTime(remainingSeconds);
  updateRing(remainingSeconds, totalSeconds);
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  btnStart.disabled  = true;
  btnPause.disabled  = false;
  intervalId = setInterval(tick, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(intervalId);
  btnStart.disabled  = false;
  btnPause.disabled  = true;
}

function resetTimer() {
  pauseTimer();
  completedSessions = 0;
  updateDots();
  body.className        = '';
  modeBadge.textContent = '⏱ Ready';
  isBreak               = false;
  totalSeconds          = parseInt(focusInput.value, 10) * 60 || 25 * 60;
  remainingSeconds      = totalSeconds;
  timerDisplay.textContent = formatTime(remainingSeconds);
  updateRing(remainingSeconds, totalSeconds);
  btnStart.disabled = false;
  btnPause.disabled = true;
}

// ---- Simple beep via Web Audio API ----
function playBeep() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type      = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch (_) { /* audio not available — silently ignore */ }
}

// ---- Event listeners ----
btnStart.addEventListener('click', () => {
  if (!isRunning && remainingSeconds === (parseInt(focusInput.value, 10) * 60 || 25 * 60) && !isBreak) {
    setMode(false);
  }
  startTimer();
});

btnPause.addEventListener('click', pauseTimer);
btnReset.addEventListener('click', resetTimer);

focusInput.addEventListener('change', () => { if (!isRunning) resetTimer(); });
breakInput.addEventListener('change', () => { if (!isRunning) resetTimer(); });

// ---- Bootstrap ----
resetTimer();
