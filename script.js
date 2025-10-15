/*
  Frontend script for events and admin pages
  - Stores events in localStorage under key 'events'
  - Exposes: renderEvents(), addEvent(), registerEvent()
  - Updates stats on the index page
*/

const STORAGE_KEY = 'events';

function getEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedEvents();
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading events from storage', e);
    return seedEvents();
  }
}

function saveEvents(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function seedEvents() {
  const initial = [
    { id: 'E001', name: 'Tech Talk', category: 'Technical', date: '2025-11-01' },
    { id: 'E002', name: 'Cultural Fest', category: 'Cultural', date: '2025-11-10' },
    { id: 'E003', name: 'Coding Hackathon', category: 'Technical', date: '2025-11-15' },
  ];
  saveEvents(initial);
  return initial;
}

function renderEvents() {
  const events = getEvents();

  // Admin view: #eventList
  const adminList = document.getElementById('eventList');
  if (adminList) {
    adminList.innerHTML = '';
    events.forEach(ev => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${ev.name} <small style="font-size:0.8rem;color:#555">(${ev.id})</small></h3>
        <p><strong>Category:</strong> ${ev.category || 'General'}</p>
        <p><strong>Date:</strong> ${ev.date}</p>
        <div style="margin-top:8px; display:flex; gap:8px; align-items:center">
          <button class="btn alt" onclick="removeEvent('${ev.id}')">Remove</button>
          <button class="btn" onclick="toggleRegistrations('${ev.id}')">View Registrations</button>
        </div>
        <div id="regs-${ev.id}" class="registrations" style="margin-top:12px; display:none"></div>
      `;
      adminList.appendChild(card);
    });
  }

  // Public events view: #events-list
  const publicList = document.getElementById('events-list');
  if (publicList) {
    publicList.innerHTML = '';
    events.forEach(ev => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${ev.name}</h3>
        <p><strong>Date:</strong> ${ev.date}</p>
        <p><strong>Category:</strong> ${ev.category || 'General'}</p>
        <div style="margin-top:8px">
          <button class="btn" onclick="registerEvent('${ev.id}', '${ev.name}')">Register</button>
        </div>
      `;
      publicList.appendChild(card);
    });
  }

  // Stats: update if present
  renderStats();
}

/* Registrations helpers */
function getRegistrations() {
  try {
    const raw = localStorage.getItem('registrations');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading registrations', e);
    return [];
  }
}

function getRegistrationsForEvent(eventId) {
  const regs = getRegistrations();
  return regs.filter(r => r.eventId === eventId);
}

function renderRegistrationsFor(eventId) {
  const container = document.getElementById(`regs-${eventId}`);
  if (!container) return;
  const regs = getRegistrationsForEvent(eventId);
  if (regs.length === 0) {
    container.innerHTML = '<em>No registrations yet.</em>';
    return;
  }
  const list = document.createElement('ul');
  regs.forEach(r => {
    const li = document.createElement('li');
    li.textContent = `${r.studentId} — ${new Date(r.when).toLocaleString()}`;
    list.appendChild(li);
  });
  container.innerHTML = '';
  container.appendChild(list);
}

function toggleRegistrations(eventId) {
  const container = document.getElementById(`regs-${eventId}`);
  if (!container) return;
  if (container.style.display === 'none' || container.style.display === '') {
    renderRegistrationsFor(eventId);
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
  }
}

function addEvent() {
  const idEl = document.getElementById('eid');
  const nameEl = document.getElementById('ename');
  const catEl = document.getElementById('category');
  const dateEl = document.getElementById('date');
  if (!idEl || !nameEl || !dateEl) {
    alert('Event form elements missing.');
    return;
  }
  const id = idEl.value.trim();
  const name = nameEl.value.trim();
  const category = catEl ? catEl.value.trim() : '';
  const date = dateEl.value;
  if (!id || !name || !date) {
    alert('Please fill in Event ID, Name and Date.');
    return;
  }

  const events = getEvents();
  if (events.find(e => e.id === id)) {
    alert('An event with that ID already exists. Choose a unique ID.');
    return;
  }

  events.push({ id, name, category, date });
  saveEvents(events);
  renderEvents();

  // clear form
  idEl.value = '';
  nameEl.value = '';
  if (catEl) catEl.value = '';
  dateEl.value = '';
  alert('Event added.');
}

function removeEvent(eventId) {
  if (!confirm('Remove this event?')) return;
  let events = getEvents();
  events = events.filter(e => e.id !== eventId);
  saveEvents(events);
  renderEvents();
}

function registerEvent(eventId, eventName) {
  const studentId = prompt(`Enter your Student ID to register for ${eventName}:`);
  if (!studentId) {
    alert('Registration cancelled.');
    return;
  }

  // store simple registrations locally (optional)
  try {
    const regKey = 'registrations';
    const raw = localStorage.getItem(regKey);
    const regs = raw ? JSON.parse(raw) : [];
    regs.push({ eventId, studentId, when: new Date().toISOString() });
    localStorage.setItem(regKey, JSON.stringify(regs));
  } catch (e) {
    console.warn('Could not save registration locally', e);
  }

  alert(`You have successfully registered for ${eventName} (Event ID: ${eventId}) with Student ID: ${studentId}.`);
  renderStats();
}

function renderStats() {
  const events = getEvents();
  const totalEventsEl = document.getElementById('total-events');
  const totalStudentsEl = document.getElementById('total-students');
  const upcomingEl = document.getElementById('upcoming-events');

  if (totalEventsEl) totalEventsEl.textContent = String(events.length);

  // registrations count
  try {
    const raw = localStorage.getItem('registrations');
    const regs = raw ? JSON.parse(raw) : [];
    if (totalStudentsEl) totalStudentsEl.textContent = String(regs.length || 120);
  } catch (e) {
    if (totalStudentsEl) totalStudentsEl.textContent = '120';
  }

  if (upcomingEl) {
    const now = new Date();
    const upcoming = events.filter(ev => new Date(ev.date) >= now).length;
    upcomingEl.textContent = String(upcoming);
  }
}

// initialize on load
window.addEventListener('DOMContentLoaded', () => {
  // If admin page or events page, render events
  if (document.getElementById('eventForm') || document.getElementById('eventList') || document.getElementById('events-list')) {
    renderEvents();
  } else {
    renderStats();
  }
});
