const timerEl = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const sessionButtons = document.querySelectorAll('.session');
const customValueInput = document.getElementById('custom-value');
const customUnitSelect = document.getElementById('custom-unit');
const setTimeBtn = document.getElementById('setTimeBtn');
const statusPill = document.getElementById('status-pill');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const taskCount = document.getElementById('task-count');
const progressBar = document.getElementById('progress-bar');
const quoteEl = document.getElementById('quote');
const orb = document.getElementById('orb');

const sessionDurations = {
  Focus: 1500,
  'Deep Work': 2700,
  Flow: 900,
  Custom: 1500,
};

actionableQuotes = [
  'Small bursts of color create steady momentum.',
  'One calm, bright session is enough to begin.',
  'Your focus deserves a little celebration.',
];

let remainingSeconds = sessionDurations.Focus;
let intervalId = null;
let isRunning = false;
let selectedSession = 'Focus';
let tasks = JSON.parse(localStorage.getItem('color-focus-tasks') || '[]');
let audioContext = null;

const themes = {
  Focus: ['#8b5cf6', '#f838db'],
  'Deep Work': ['#f59e0b', '#8858f7'],
  Flow: ['#34d399', '#ffbaea'],
  Custom: ['#14b8a6', '#48ecaa'],
};

function formatTime(seconds) {
  const totalSeconds = Math.max(0, seconds);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function renderTimer() {
  timerEl.textContent = formatTime(remainingSeconds);
  const percent = ((remainingSeconds / sessionDurations[selectedSession]) * 100).toFixed(1);
  progressBar.style.width = `${100 - Number(percent)}%`;
}

function setTheme(sessionName) {
  const [first, second] = themes[sessionName];
  document.documentElement.style.setProperty('--accent', first);
  document.documentElement.style.setProperty('--accent-2', second);
  orb.style.background = `conic-gradient(from 180deg, ${first}, ${second}, var(--accent-3), ${first})`;
  statusPill.textContent = `${sessionName} mode`;
}

function updateTasks() {
  taskCount.textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'}`;
  taskList.innerHTML = '';

  if (!tasks.length) {
    const empty = document.createElement('li');
    empty.className = 'task-item';
    empty.innerHTML = '<span>No tasks yet — add one and begin.</span>';
    taskList.appendChild(empty);
    return;
  }

  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = `task-item ${task.done ? 'completed' : ''}`;
    li.innerHTML = `
      <input type="checkbox" ${task.done ? 'checked' : ''} />
      <span>${task.text}</span>
      <button data-index="${index}">Remove</button>
    `;

    const checkbox = li.querySelector('input');
    checkbox.addEventListener('change', () => {
      tasks[index].done = checkbox.checked;
      saveTasks();
      updateTasks();
    });

    const removeBtn = li.querySelector('button');
    removeBtn.addEventListener('click', () => {
      tasks.splice(index, 1);
      saveTasks();
      updateTasks();
    });

    taskList.appendChild(li);
  });
}

function saveTasks() {
  localStorage.setItem('color-focus-tasks', JSON.stringify(tasks));
}

function playCompletionSound() {
  if (!window.AudioContext && !window.webkitAudioContext) return;

  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const notePattern = [1046.5, 1046.5, 1318.5, 1046.5, 1046.5, 1318.5, 1046.5];
  const noteDuration = 0.12;
  const pauseDuration = 0.04;

  notePattern.forEach((freq, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const startTime = audioContext.currentTime + index * (noteDuration + pauseDuration);
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(freq, startTime);
    gainNode.gain.setValueAtTime(0.24, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.11);
  });
}

function getValidatedCustomSeconds() {
  const value = Number.parseInt(customValueInput.value, 10);
  const unit = customUnitSelect.value;
  const multipliers = {
    seconds: 1,
    minutes: 60,
    hours: 3600,
    days: 86400,
  };
  const maxValues = {
    seconds: 31536000,
    minutes: 525600,
    hours: 8760,
    days: 365,
  };

  if (!Number.isFinite(value) || value < 0.2) {
    customValueInput.value = '25';
    customUnitSelect.value = 'minutes';
    return 1500;
  }

  const boundedValue = Math.min(value, maxValues[unit]);
  customValueInput.value = String(boundedValue);
  return boundedValue * multipliers[unit];
}

function ensureCustomTimeIfSelected() {
  if (selectedSession !== 'Custom') return;
  sessionDurations.Custom = getValidatedCustomSeconds();
}

function startTimer() {
  if (isRunning) return;
  const isResuming = startBtn.textContent === 'Resume';
  ensureCustomTimeIfSelected();
  if (selectedSession === 'Custom' && !isResuming) {
    remainingSeconds = sessionDurations.Custom;
    renderTimer();
  }
  isRunning = true;
  startBtn.textContent = 'Running';
  statusPill.textContent = `${selectedSession} underway`;
  intervalId = setInterval(() => {
    remainingSeconds -= 1;
    renderTimer();

    if (remainingSeconds <= 0) {
      clearInterval(intervalId);
      isRunning = false;
      startBtn.textContent = 'Start';
      statusPill.textContent = 'Session complete';
      quoteEl.textContent = 'Nice work — a bright finish deserves a pause.';
      playCompletionSound();
    }
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  clearInterval(intervalId);
  isRunning = false;
  startBtn.textContent = 'Resume';
  statusPill.textContent = 'Paused';
}

function resetTimer() {
  clearInterval(intervalId);
  isRunning = false;
  remainingSeconds = sessionDurations[selectedSession];
  renderTimer();
  startBtn.textContent = 'Start';
  statusPill.textContent = `${selectedSession} ready`;
}

function applyCustomTime() {
  const seconds = getValidatedCustomSeconds();
  selectedSession = 'Custom';
  sessionDurations.Custom = seconds;
  sessionButtons.forEach((btn) => btn.classList.toggle('active', btn.textContent === 'Custom'));
  setTheme(selectedSession);
  resetTimer();
}

sessionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    sessionButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    selectedSession = button.textContent;
    ensureCustomTimeIfSelected();
    remainingSeconds = sessionDurations[selectedSession];
    renderTimer();
    setTheme(selectedSession);
    resetTimer();
  });
});

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
setTimeBtn.addEventListener('click', applyCustomTime);

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = taskInput.value.trim();
  if (!value) return;
  tasks.push({ text: value, done: false });
  taskInput.value = '';
  saveTasks();
  updateTasks();
});

setTheme(selectedSession);
renderTimer();
updateTasks();
quoteEl.textContent = actionableQuotes[Math.floor(Math.random() * actionableQuotes.length)];
