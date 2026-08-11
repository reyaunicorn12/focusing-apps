const timerEl = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const sessionButtons = document.querySelectorAll('.session');
const customMinutesInput = document.getElementById('custom-minutes');
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

const themes = {
  Focus: ['#8b5cf6', '#38bdf8'],
  'Deep Work': ['#f59e0b', '#8b5cf6'],
  Flow: ['#34d399', '#f472b6'],
  Custom: ['#14b8a6', '#ec4899'],
};

function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
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

function startTimer() {
  if (isRunning) return;
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
  const minutes = Number.parseInt(customMinutesInput.value, 10);
  if (!Number.isFinite(minutes) || minutes < 1) {
    customMinutesInput.value = '25';
    return;
  }

  const seconds = Math.min(10800, minutes * 60);
  selectedSession = 'Custom';
  sessionDurations.Custom = seconds;
  remainingSeconds = seconds;
  sessionButtons.forEach((btn) => btn.classList.toggle('active', btn.textContent === 'Custom'));
  setTheme(selectedSession);
  renderTimer();
  resetTimer();
}

sessionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    sessionButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    selectedSession = button.textContent;
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
