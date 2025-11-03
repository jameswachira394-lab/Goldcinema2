// Authentication state management
let currentUser = null;

// Event listeners for auth-related elements
document.addEventListener('DOMContentLoaded', () => {
    // Check for existing session
    checkAuthStatus();

    // Add event listeners for auth forms
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
    document.querySelector('.user-account')?.addEventListener('click', handleAccountClick);
});

// Check authentication status
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (token) {
        // Verify token with backend
        verifyToken(token)
            .then(user => {
                updateAuthStatus(user);
            })
            .catch(() => {
                // Token invalid, clear it
                localStorage.removeItem('token');
                updateAuthStatus(null);
            });
    }
}

// Verify JWT token
async function verifyToken(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Token invalid');
        return await response.json();
    } catch (error) {
        throw error;
    }
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await api.login({ email, password });
        if (response.token) {
            localStorage.setItem('token', response.token);
            currentUser = response.user;
            updateAuthStatus(response.user);
            closeLoginModal();
            showNotification('Login successful!', 'success');
        }
    } catch (error) {
        showNotification('Login failed. Please check your credentials.', 'error');
    }
}

// Handle registration form submission
async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showNotification('Passwords do not match!', 'error');
        return;
    }

    try {
        const response = await api.register({ name, email, password });
        if (response.token) {
            localStorage.setItem('token', response.token);
            currentUser = response.user;
            updateAuthStatus(response.user);
            closeRegisterModal();
            showNotification('Registration successful!', 'success');
        }
    } catch (error) {
        showNotification('Registration failed. Please try again.', 'error');
    }
}

// Update UI based on auth status
function updateAuthStatus(user) {
    const accountStatus = document.getElementById('accountStatus');
    const accountIcon = document.querySelector('.user-account i');

    if (user) {
        currentUser = user;
        accountStatus.textContent = user.name;
        accountIcon.className = 'fas fa-user-check';
        document.body.classList.add('logged-in');
    } else {
        currentUser = null;
        accountStatus.textContent = 'Sign In';
        accountIcon.className = 'fas fa-user';
        document.body.classList.remove('logged-in');
    }
}

// Handle account button click
function handleAccountClick(event) {
    event.preventDefault();
    
    if (currentUser) {
        showUserMenu();
    } else {
        showLoginModal();
    }
}

// Show user menu dropdown
function showUserMenu() {
    const menu = document.createElement('div');
    menu.className = 'user-menu';
    menu.innerHTML = `
        <ul>
            <li><a href="#profile">Profile</a></li>
            <li><a href="#bookings">My Bookings</a></li>
            <li><a href="#settings">Settings</a></li>
            <li><a href="#" onclick="handleLogout()">Logout</a></li>
        </ul>
    `;

    const accountButton = document.querySelector('.user-account');
    accountButton.appendChild(menu);

    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target) && !accountButton.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    });
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('token');
    currentUser = null;
    updateAuthStatus(null);
    showNotification('Logged out successfully!', 'success');
}

// Modal control functions
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'block';
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
}

function showLoginForm() {
    closeRegisterModal();
    showLoginModal();
}

function showRegisterForm() {
    closeLoginModal();
    showRegisterModal();
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Export necessary functions
export {
    currentUser,
    checkAuthStatus,
    handleLogin,
    handleRegister,
    handleLogout,
    showLoginModal,
    showRegisterModal
};