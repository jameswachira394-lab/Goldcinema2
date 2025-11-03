// Initialize charts and data when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    loadDashboardData();
    loadEvents();
    loadAdvisors();
    loadAssignments();
    setupEventListeners();
});

// Chart initialization
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
            plugins: {
                legend: {
                    labels: {
                        color: '#fff'
                    }
                }
            },
            scales: {
                y: {
                    grid: {
                        color: 'rgba(255,255,255,0.1)'
                    },
                    ticks: {
                        color: '#fff'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255,255,255,0.1)'
                    },
                    ticks: {
                        color: '#fff'
                    }
                }
            }
        }
    });
}

// Load dashboard data
function loadDashboardData() {
    // Load recent activity
    const activityList = document.querySelector('.activity-list');
    const recentActivities = [
        { type: 'booking', message: 'New booking for "Inception"', time: '5 minutes ago' },
        { type: 'event', message: 'New event "Movie Marathon" created', time: '1 hour ago' },
        { type: 'advisor', message: 'New advisor John Doe assigned', time: '2 hours ago' },
        // Add more activities
    ];

    activityList.innerHTML = recentActivities.map(activity => `
        <div class="activity-item">
            <i class="fas ${getActivityIcon(activity.type)}"></i>
            <div class="activity-details">
                <p>${activity.message}</p>
                <small>${activity.time}</small>
            </div>
        </div>
    `).join('');
}

function getActivityIcon(type) {
    const icons = {
        booking: 'fa-ticket-alt',
        event: 'fa-calendar-alt',
        advisor: 'fa-user-tie',
        default: 'fa-info-circle'
    };
    return icons[type] || icons.default;
}

// Event Management
function loadEvents() {
    const eventsGrid = document.querySelector('.events-grid');
    const events = [
        {
            id: 1,
            title: 'Movie Marathon',
            date: '2023-11-15',
            description: 'All day movie marathon featuring classic films',
            image: 'event1.jpg',
            price: 49.99,
            capacity: 100
        },
        // Add more events
    ];

    eventsGrid.innerHTML = events.map(event => `
        <div class="event-card">
            <img src="${event.image}" alt="${event.title}">
            <div class="event-info">
                <h3>${event.title}</h3>
                <p>${event.description}</p>
                <div class="event-meta">
                    <span><i class="fas fa-calendar"></i> ${formatDate(event.date)}</span>
                    <span><i class="fas fa-dollar-sign"></i> ${event.price}</span>
                    <span><i class="fas fa-users"></i> ${event.capacity}</span>
                </div>
                <div class="event-actions">
                    <button onclick="editEvent(${event.id})" class="admin-btn">Edit</button>
                    <button onclick="deleteEvent(${event.id})" class="admin-btn danger">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

function showAddEventModal() {
    document.getElementById('addEventModal').style.display = 'block';
}

function closeAddEventModal() {
    document.getElementById('addEventModal').style.display = 'none';
}

function handleAddEvent(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    // Add event to database
    // Reload events list
    loadEvents();
    closeAddEventModal();
}

// Advisor Management
function loadAdvisors() {
    const advisorsGrid = document.querySelector('.advisors-grid');
    const advisors = [
        {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            phone: '123-456-7890',
            specialization: 'VIP Customers',
            activeCustomers: 15
        },
        // Add more advisors
    ];

    advisorsGrid.innerHTML = advisors.map(advisor => `
        <div class="advisor-card">
            <div class="advisor-info">
                <h3>${advisor.name}</h3>
                <p><i class="fas fa-envelope"></i> ${advisor.email}</p>
                <p><i class="fas fa-phone"></i> ${advisor.phone}</p>
                <p><i class="fas fa-star"></i> ${advisor.specialization}</p>
                <p><i class="fas fa-users"></i> ${advisor.activeCustomers} active customers</p>
            </div>
            <div class="advisor-actions">
                <button onclick="editAdvisor(${advisor.id})" class="admin-btn">Edit</button>
                <button onclick="deleteAdvisor(${advisor.id})" class="admin-btn danger">Delete</button>
            </div>
        </div>
    `).join('');
}

function showAddAdvisorModal() {
    document.getElementById('addAdvisorModal').style.display = 'block';
}

function closeAddAdvisorModal() {
    document.getElementById('addAdvisorModal').style.display = 'none';
}

function handleAddAdvisor(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    // Add advisor to database
    // Reload advisors list
    loadAdvisors();
    closeAddAdvisorModal();
}

// Customer-Advisor Assignments
function loadAssignments() {
    const assignmentsTable = document.querySelector('.assignments-table tbody');
    const assignments = [
        {
            customer: 'Alice Johnson',
            advisor: 'John Doe',
            status: 'Active',
            lastContact: '2023-11-02'
        },
        // Add more assignments
    ];

    assignmentsTable.innerHTML = assignments.map(assignment => `
        <tr>
            <td>${assignment.customer}</td>
            <td>${assignment.advisor}</td>
            <td><span class="status ${assignment.status.toLowerCase()}">${assignment.status}</span></td>
            <td>${formatDate(assignment.lastContact)}</td>
            <td>
                <button onclick="editAssignment('${assignment.customer}')" class="admin-btn small">Edit</button>
                <button onclick="viewHistory('${assignment.customer}')" class="admin-btn small">History</button>
            </td>
        </tr>
    `).join('');
}

// Utility Functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.admin-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);
        });
    });
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.admin-nav a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        }
    });
}