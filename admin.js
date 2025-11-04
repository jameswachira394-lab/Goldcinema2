// Admin Dashboard Logic with LocalStorage Persistence

document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    loadDashboardData();
    loadEvents();
    loadAdvisors();
    loadAssignments();
    setupEventListeners();
});

// ===== CHART =====
function initializeCharts() {
    const ctx = document.getElementById('bookingChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Monthly Bookings',
                data: [65, 59, 80, 81, 56, 90],
                borderColor: '#00f3ff',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(0,243,255,0.1)'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } },
                x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } }
            }
        }
    });
}

// ===== UTILITIES =====
function getLocalData(key, fallback = []) {
    return JSON.parse(localStorage.getItem(key)) || fallback;
}

function saveLocalData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ===== DASHBOARD =====
function loadDashboardData() {
    const activityList = document.querySelector('.activity-list');
    const activities = getLocalData('activities', [
        { type: 'booking', message: 'New booking for "Inception"', time: '5 minutes ago' },
        { type: 'event', message: 'Event "Movie Marathon" created', time: '1 hour ago' },
        { type: 'advisor', message: 'Advisor John Doe assigned', time: '2 hours ago' }
    ]);

    activityList.innerHTML = activities.map(a => `
        <div class="activity-item">
            <i class="fas ${getActivityIcon(a.type)}"></i>
            <div class="activity-details">
                <p>${a.message}</p>
                <small>${a.time}</small>
            </div>
        </div>`).join('');
}

function getActivityIcon(type) {
    const icons = { booking: 'fa-ticket-alt', event: 'fa-calendar-alt', advisor: 'fa-user-tie', default: 'fa-info-circle' };
    return icons[type] || icons.default;
}

// ===== EVENTS =====
let editEventId = null;

function loadEvents() {
    const eventsGrid = document.querySelector('.events-grid');
    const events = getLocalData('events', []);
    if (!events.length) {
        const sample = [{ id: Date.now(), title: 'Movie Marathon', date: '2025-11-15', description: 'All day classics', image: 'event1.jpg', price: 49.99, capacity: 100 }];
        saveLocalData('events', sample);
        return loadEvents();
    }

    eventsGrid.innerHTML = events.map(e => `
        <div class="event-card">
            <img src="${e.image}" alt="${e.title}">
            <div class="event-info">
                <h3>${e.title}</h3>
                <p>${e.description}</p>
                <div class="event-meta">
                    <span><i class="fas fa-calendar"></i> ${formatDate(e.date)}</span>
                    <span><i class="fas fa-dollar-sign"></i> ${e.price}</span>
                    <span><i class="fas fa-users"></i> ${e.capacity}</span>
                </div>
                <div class="event-actions">
                    <button onclick="editEvent(${e.id})" class="admin-btn">Edit</button>
                    <button onclick="deleteEvent(${e.id})" class="admin-btn danger">Delete</button>
                </div>
            </div>
        </div>`).join('');
}

function showAddEventModal() {
    editEventId = null;
    document.getElementById('addEventForm').reset();
    document.getElementById('addEventModal').style.display = 'block';
}

function closeAddEventModal() {
    document.getElementById('addEventModal').style.display = 'none';
}

function handleAddEvent(ev) {
    ev.preventDefault();
    const events = getLocalData('events', []);
    const form = ev.target;

    const data = {
        id: editEventId || Date.now(),
        title: form.eventTitle.value,
        date: form.eventDate.value,
        description: form.eventDescription.value,
        image: form.eventImage.value || 'default.jpg',
        price: parseFloat(form.eventPrice.value),
        capacity: parseInt(form.eventCapacity.value)
    };

    if (editEventId) {
        const idx = events.findIndex(e => e.id === editEventId);
        events[idx] = data;
    } else {
        events.push(data);
    }

    saveLocalData('events', events);
    closeAddEventModal();
    loadEvents();
}

function editEvent(id) {
    const events = getLocalData('events', []);
    const e = events.find(ev => ev.id === id);
    if (!e) return;
    editEventId = id;

    const f = document.getElementById('addEventForm');
    f.eventTitle.value = e.title;
    f.eventDate.value = e.date;
    f.eventDescription.value = e.description;
    f.eventPrice.value = e.price;
    f.eventCapacity.value = e.capacity;
    document.getElementById('addEventModal').style.display = 'block';
}

function deleteEvent(id) {
    let events = getLocalData('events', []);
    events = events.filter(e => e.id !== id);
    saveLocalData('events', events);
    loadEvents();
}

// ===== ADVISORS =====
let editAdvisorId = null;

function loadAdvisors() {
    const grid = document.querySelector('.advisors-grid');
    const advisors = getLocalData('advisors', []);
    if (!advisors.length) {
        const sample = [{ id: Date.now(), name: 'John Doe', email: 'john@example.com', phone: '123-456-7890', specialization: 'VIP Customers', activeCustomers: 15 }];
        saveLocalData('advisors', sample);
        return loadAdvisors();
    }

    grid.innerHTML = advisors.map(a => `
        <div class="advisor-card">
            <h3>${a.name}</h3>
            <p><i class="fas fa-envelope"></i> ${a.email}</p>
            <p><i class="fas fa-phone"></i> ${a.phone}</p>
            <p><i class="fas fa-star"></i> ${a.specialization}</p>
            <p><i class="fas fa-users"></i> ${a.activeCustomers} active</p>
            <div class="advisor-actions">
                <button onclick="editAdvisor(${a.id})" class="admin-btn">Edit</button>
                <button onclick="deleteAdvisor(${a.id})" class="admin-btn danger">Delete</button>
            </div>
        </div>`).join('');
}

function showAddAdvisorModal() {
    editAdvisorId = null;
    document.getElementById('addAdvisorForm').reset();
    document.getElementById('addAdvisorModal').style.display = 'block';
}

function closeAddAdvisorModal() {
    document.getElementById('addAdvisorModal').style.display = 'none';
}

function handleAddAdvisor(ev) {
    ev.preventDefault();
    const advisors = getLocalData('advisors', []);
    const form = ev.target;

    const data = {
        id: editAdvisorId || Date.now(),
        name: form.advisorName.value,
        email: form.advisorEmail.value,
        phone: form.advisorPhone.value,
        specialization: form.advisorSpecialization.value,
        activeCustomers: Math.floor(Math.random() * 30)
    };

    if (editAdvisorId) {
        const idx = advisors.findIndex(a => a.id === editAdvisorId);
        advisors[idx] = data;
    } else {
        advisors.push(data);
    }

    saveLocalData('advisors', advisors);
    closeAddAdvisorModal();
    loadAdvisors();
}

function editAdvisor(id) {
    const advisors = getLocalData('advisors', []);
    const a = advisors.find(ad => ad.id === id);
    if (!a) return;
    editAdvisorId = id;

    const f = document.getElementById('addAdvisorForm');
    f.advisorName.value = a.name;
    f.advisorEmail.value = a.email;
    f.advisorPhone.value = a.phone;
    f.advisorSpecialization.value = a.specialization;
    document.getElementById('addAdvisorModal').style.display = 'block';
}

function deleteAdvisor(id) {
    let advisors = getLocalData('advisors', []);
    advisors = advisors.filter(a => a.id !== id);
    saveLocalData('advisors', advisors);
    loadAdvisors();
}

// ===== ASSIGNMENTS =====
function loadAssignments() {
    const tbody = document.querySelector('.assignments-table tbody');
    const advisors = getLocalData('advisors', []);
    const assignments = getLocalData('assignments', [
        { customer: 'Alice Johnson', advisor: advisors[0]?.name || 'John Doe', status: 'Active', lastContact: '2025-11-02' }
    ]);

    tbody.innerHTML = assignments.map(as => `
        <tr>
            <td>${as.customer}</td>
            <td>${as.advisor}</td>
            <td><span class="status ${as.status.toLowerCase()}">${as.status}</span></td>
            <td>${formatDate(as.lastContact)}</td>
            <td>
                <button class="admin-btn small">Edit</button>
                <button class="admin-btn small">History</button>
            </td>
        </tr>`).join('');

    saveLocalData('assignments', assignments);
}

// ===== NAVIGATION =====
function setupEventListeners() {
    document.querySelectorAll('.admin-nav a').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);
        });
    });
}

function showSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('.admin-nav a').forEach(l => {
        l.classList.remove('active');
        if (l.getAttribute('data-section') === sectionId) l.classList.add('active');
    });
}