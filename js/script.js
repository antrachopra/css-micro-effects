const noteGrid = document.querySelector('#note-grid');
const noteCards = Array.from(noteGrid.querySelectorAll('.note-card'));
const noteSearch = document.querySelector('#note-search');
const noteFilter = document.querySelector('#note-filter');
const emptyState = document.querySelector('#empty-state');
const loadingLine = document.querySelector('#note-status');
const loadingCopy = document.querySelector('#loading-copy');
const loadError = document.querySelector('#load-error');
const refreshButton = document.querySelector('#refresh-button');
const errorDemoButton = document.querySelector('#error-demo-button');
const retryButton = document.querySelector('#retry-button');
const toastRegion = document.querySelector('#toast-region');
const signupForm = document.querySelector('#signup-form');
const emailInput = document.querySelector('#email-input');
const emailHelp = document.querySelector('#email-help');

let refreshTimer;
let requestVersion = 0;

function filterNotes() {
  const phrase = noteSearch.value.trim().toLowerCase();
  const topic = noteFilter.value;
  let visibleCount = 0;

  noteCards.forEach((card) => {
    const matchesPhrase = card.dataset.title.toLowerCase().includes(phrase)
      || card.textContent.toLowerCase().includes(phrase);
    const matchesTopic = topic === 'all' || card.dataset.topic === topic;
    const visible = matchesPhrase && matchesTopic;
    card.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  emptyState.hidden = visibleCount !== 0;
}

function createSkeletons(count = 3) {
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < count; index += 1) {
    const skeleton = document.createElement('div');
    skeleton.className = 'note-skeleton';
    skeleton.setAttribute('aria-hidden', 'true');
    ['tall', 'wide', 'medium', 'copy', 'medium'].forEach((size) => {
      const shape = document.createElement('span');
      shape.className = `skeleton-shape ${size}`;
      skeleton.append(shape);
    });
    fragment.append(skeleton);
  }
  return fragment;
}

function simulateRefresh(shouldFail = false) {
  const currentVersion = ++requestVersion;
  window.clearTimeout(refreshTimer);
  refreshButton.disabled = true;
  loadingLine.hidden = false;
  loadingCopy.textContent = shouldFail ? 'Trying to reconnect…' : 'Gathering the latest notes…';
  loadError.hidden = true;
  emptyState.hidden = true;
  noteGrid.setAttribute('aria-busy', 'true');
  noteGrid.replaceChildren(createSkeletons());

  refreshTimer = window.setTimeout(() => {
    if (currentVersion !== requestVersion) return;
    loadingLine.hidden = true;
    refreshButton.disabled = false;
    noteGrid.setAttribute('aria-busy', 'false');
    if (shouldFail) {
      noteGrid.replaceChildren();
      loadError.hidden = false;
      showToast('error', 'The notes could not be refreshed. Try again in a moment.');
      return;
    }
    noteGrid.replaceChildren(...noteCards);
    filterNotes();
    showToast('success', 'Your field notes are up to date.');
  }, 1050);
}

const toastCopy = {
  success: { title: 'All set', message: 'Your changes have been saved.', icon: '✓' },
  info: { title: 'Just so you know', message: 'There’s a new note ready when you are.', icon: 'i' },
  warning: { title: 'One small thing', message: 'A field could use a little more attention.', icon: '△' },
  error: { title: 'That didn’t work', message: 'Something went off track. Give it another try.', icon: '!' },
};

function showToast(type, message, duration = 4200) {
  const content = toastCopy[type];
  if (!content) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = content.icon;
  const copy = document.createElement('div');
  copy.className = 'toast-copy';
  const title = document.createElement('strong');
  title.textContent = content.title;
  const body = document.createElement('span');
  body.textContent = message || content.message;
  copy.append(title, body);

  const close = document.createElement('button');
  close.className = 'toast-close';
  close.type = 'button';
  close.textContent = '×';
  close.setAttribute('aria-label', `Dismiss ${type} notification`);
  let timer;
  const dismiss = () => {
    if (toast.classList.contains('is-leaving')) return;
    window.clearTimeout(timer);
    toast.classList.add('is-leaving');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    window.setTimeout(() => toast.remove(), 260);
  };
  close.addEventListener('click', dismiss);
  toast.append(icon, copy, close);
  toastRegion.append(toast);
  timer = window.setTimeout(dismiss, duration);
}

document.querySelectorAll('[data-toast]').forEach((button) => {
  button.addEventListener('click', () => showToast(button.dataset.toast));
});

noteSearch.addEventListener('input', filterNotes);
noteFilter.addEventListener('change', filterNotes);
refreshButton.addEventListener('click', () => simulateRefresh());
errorDemoButton.addEventListener('click', () => simulateRefresh(true));
retryButton.addEventListener('click', () => simulateRefresh());

document.querySelectorAll('.save-button').forEach((button) => {
  button.addEventListener('click', () => {
    const isSaved = button.getAttribute('aria-pressed') === 'true';
    button.setAttribute('aria-pressed', String(!isSaved));
    button.innerHTML = isSaved ? '<span aria-hidden="true">♡</span> Save note' : '<span aria-hidden="true">♥</span> Saved';
    showToast(isSaved ? 'info' : 'success', isSaved ? 'Note removed from your saved list.' : 'Note added to your saved list.');
  });
});

emailInput.addEventListener('input', () => {
  emailInput.removeAttribute('aria-invalid');
  emailHelp.textContent = 'A small field with a clear focus state.';
});

signupForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!emailInput.value.trim() || !emailInput.validity.valid) {
    emailInput.setAttribute('aria-invalid', 'true');
    emailHelp.textContent = 'Add a valid email address to continue.';
    emailInput.focus();
    showToast('warning', 'Check the email address and try again.');
    return;
  }
  signupForm.reset();
  emailHelp.textContent = 'A small field with a clear focus state.';
  showToast('success', 'You’re on the field-notes list.');
});

// A quiet console note helps learners find the reusable demo functions.
console.info('Little Signals ready. Try showToast(type, message) and simulateRefresh(true) in the console.');
