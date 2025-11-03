// Import modules
import api from './api.js';
import { checkAuthStatus, handleLogin, handleRegister } from './auth.js';
import { loadMovies, showMovieDetails, performSearch } from './movies.js';
import { startBooking } from './booking.js';

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize features
    initializeApp();
    setupEventListeners();
    loadInitialContent();
});

// App initialization
function initializeApp() {
    // Check authentication status
    checkAuthStatus();
    
    // Setup notifications container
    setupNotifications();
    
    // Initialize mobile navigation
    initMobileNav();
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelector('.mobile-nav-toggle')?.addEventListener('click', toggleMobileNav);
    
    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', handleSmoothScroll);
    });
    
    // Search functionality
    document.getElementById('searchInput')?.addEventListener('input', debounce(performSearch, 300));
    
    // Modal close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Newsletter form
    document.getElementById('newsletterForm')?.addEventListener('submit', handleNewsletterSubmit);
    
    // Contact form
    document.getElementById('contactForm')?.addEventListener('submit', handleContactSubmit);
}

// Load initial content
function loadInitialContent() {
    // Load movies
    loadMovies();
    
    // Load events
    loadEvents();
    
    // Load food & beverages
    loadFoodItems();
}

// Mobile navigation
function initMobileNav() {
    const nav = document.querySelector('.nav-links');
    const toggle = document.querySelector('.mobile-nav-toggle');
    
    if (nav && toggle) {
        toggle.innerHTML = '<i class="fas fa-bars"></i>';
        nav.classList.add('nav-closed');
    }
}

function toggleMobileNav() {
    const nav = document.querySelector('.nav-links');
    const toggle = document.querySelector('.mobile-nav-toggle');
    
    if (nav && toggle) {
        nav.classList.toggle('nav-closed');
        toggle.innerHTML = nav.classList.contains('nav-closed') ? 
            '<i class="fas fa-bars"></i>' : 
            '<i class="fas fa-times"></i>';
    }
}

// Smooth scroll
function handleSmoothScroll(e) {
    e.preventDefault();
    
    const targetId = e.currentTarget.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    
    if (targetElement) {
        targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        
        // Close mobile nav if open
        const nav = document.querySelector('.nav-links');
        if (nav && !nav.classList.contains('nav-closed')) {
            toggleMobileNav();
        }
    }
}

// Newsletter subscription
async function handleNewsletterSubmit(e) {
    e.preventDefault();
    
    const email = e.target.querySelector('input[type="email"]').value;
    
    try {
        await api.subscribeNewsletter(email);
        showNotification('Successfully subscribed to newsletter!', 'success');
        e.target.reset();
    } catch (error) {
        showNotification('Failed to subscribe to newsletter. Please try again.', 'error');
    }
}

// Contact form submission
async function handleContactSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: e.target.name.value,
        email: e.target.email.value,
        message: e.target.message.value
    };
    
    try {
        await api.submitContactForm(formData);
        showNotification('Message sent successfully!', 'success');
        e.target.reset();
    } catch (error) {
        showNotification('Failed to send message. Please try again.', 'error');
    }
}

// Notification system
function setupNotifications() {
    const container = document.createElement('div');
    container.id = 'notifications';
    document.body.appendChild(container);
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notifications');
    const notification = document.createElement('div');
    
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load events
async function loadEvents() {
    try {
        const events = await api.getEvents();
        displayEvents(events);
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// Display events
function displayEvents(events) {
    const eventGrid = document.getElementById('eventGrid');
    if (!eventGrid) return;
    
    eventGrid.innerHTML = events.map(event => `
        <div class="event-card">
            <img src="${event.image}" alt="${event.title}">
            <div class="event-info">
                <h3>${event.title}</h3>
                <p>${event.description}</p>
                <div class="event-meta">
                    <span><i class="fas fa-calendar"></i> ${formatDate(event.date)}</span>
                    <span><i class="fas fa-ticket-alt"></i> $${event.price}</span>
                </div>
                <button class="book-btn" onclick="startBooking('event', ${event.id})">
                    Book Now
                </button>
            </div>
        </div>
    `).join('');
}

// Load food & beverages
async function loadFoodItems() {
    try {
        const items = await api.getFoodItems();
        displayFoodItems(items);
    } catch (error) {
        console.error('Error loading food items:', error);
    }
}

// Display food items
function displayFoodItems(items) {
    const foodGrid = document.querySelector('.food-grid');
    if (!foodGrid) return;
    
    foodGrid.innerHTML = items.map(item => `
        <div class="food-card">
            <img src="${item.image}" alt="${item.name}">
            <div class="food-info">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="food-meta">
                    <span class="price">$${item.price}</span>
                    <button class="add-to-cart" onclick="addToCart(${item.id})">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Export necessary functions
export {
    showNotification,
    formatDate
};