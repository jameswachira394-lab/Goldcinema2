const API_BASE = "http://localhost:4000/api";
let token = localStorage.getItem("gc_token");
let currentUser = JSON.parse(localStorage.getItem("gc_user"));
let currentBooking = null;

// Price configuration
const PRICES = {
    movie: { vvip: 750, vip: 300, regular: 150 },
    concert: { vvip: 800, vip: 500, regular: 250 },
    play: { vvip: 1000, vip: 500, regular: 250 }
};

document.addEventListener("DOMContentLoaded", () => {
    updateAuthStatus();
    setupEventListeners();
    setupPaymentListeners();
    loadFontAwesome();
});

function loadFontAwesome() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    document.head.appendChild(link);
}

// Search and Filter Functions
function performSearch() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const genre = document.getElementById('genreFilter').value;
    const date = document.getElementById('dateFilter').value;
    const price = document.getElementById('priceFilter').value;
    
    // Filter all media items based on criteria
    filterMedia(searchQuery, category, genre, date, price);
}

function filterMedia(query, category, genre, date, price) {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const title = card.querySelector('h4').textContent.toLowerCase();
        const cardCategory = card.closest('section').id.replace('-section', '');
        const cardGenre = card.querySelector('.movie-info span:first-child').textContent.toLowerCase();
        
        let show = true;
        
        // Apply filters
        if (query && !title.includes(query)) show = false;
        if (category !== 'all' && cardCategory !== category) show = false;
        if (genre !== 'all' && !cardGenre.includes(genre)) show = false;
        
        // Show/hide card
        card.style.display = show ? 'block' : 'none';
    });
}

// Movie Details Functions
function showMovieDetails(movieId) {
    // Fetch movie details from API
    const movieDetails = getMovieDetails(movieId);
    
    // Update modal content
    document.getElementById('modalMovieTitle').textContent = movieDetails.title;
    document.getElementById('modalMovieYear').textContent = movieDetails.year;
    document.getElementById('modalMovieRating').textContent = `${movieDetails.rating}/10`;
    document.getElementById('modalMovieDuration').textContent = `${movieDetails.duration} min`;
    document.getElementById('modalMovieSynopsis').textContent = movieDetails.synopsis;
    document.getElementById('modalMoviePoster').src = movieDetails.poster;
    
    // Update cast
    const castHTML = movieDetails.cast.map(actor => `
        <div class="cast-member">
            <img src="${actor.photo}" alt="${actor.name}">
            <p>${actor.name}</p>
            <small>${actor.role}</small>
        </div>
    `).join('');
    document.getElementById('modalMovieCast').innerHTML = castHTML;
    
    // Show modal
    document.getElementById('movieDetailsModal').style.display = 'block';
}

function closeMovieDetails() {
    document.getElementById('movieDetailsModal').style.display = 'none';
}

// Trailer Functions
function showTrailer(videoId) {
    const player = document.getElementById('trailerPlayer');
    player.innerHTML = `
        <iframe
            src="https://www.youtube.com/embed/${videoId}?autoplay=1"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
        ></iframe>
    `;
    document.getElementById('trailerModal').style.display = 'block';
}

function closeTrailer() {
    document.getElementById('trailerPlayer').innerHTML = '';
    document.getElementById('trailerModal').style.display = 'none';
}

// Showtime Selection
function selectShowtime(movie, time) {
    // Remove active class from all time buttons
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to selected button
    event.target.classList.add('active');
    
    // Store selected time for booking
    currentBooking = {
        ...currentBooking,
        showtime: time
    };
}

function updateAuthStatus() {
    const authLinks = document.querySelectorAll('.auth-hidden');
    const userLinks = document.querySelectorAll('.user-hidden');
    const profileSection = document.getElementById('profileSection');
    
    if (token && currentUser) {
        // User is logged in
        authLinks.forEach(el => el.style.display = 'none');
        userLinks.forEach(el => el.style.display = 'block');
        document.getElementById('navUsername').textContent = currentUser.username;
        
        // Update profile info if visible
        if (profileSection && profileSection.style.display !== 'none') {
            document.getElementById('profileUsername').textContent = currentUser.username;
            document.getElementById('profileEmail').textContent = currentUser.email || 'Not set';
        }
    } else {
        // User is logged out
        authLinks.forEach(el => el.style.display = 'inline-block');
        userLinks.forEach(el => el.style.display = 'none');
        if (profileSection) profileSection.style.display = 'none';
    }
}

function setupPaymentListeners() {
  // Seat category selection
  document.querySelectorAll('input[name="seatCategory"]').forEach(input => {
    input.addEventListener('change', updateTotal);
  });

  // Ticket quantity change
  document.getElementById('quantity').addEventListener('change', updateTotal);

  // Payment method selection
  document.querySelectorAll('input[name="paymentMethod"]').forEach(input => {
    input.addEventListener('change', () => {
      const method = input.value;
      document.getElementById('mpesaForm').style.display = method === 'mpesa' ? 'block' : 'none';
      document.getElementById('cardForm').style.display = method === 'card' ? 'block' : 'none';
    });
  });

  // Close modal when clicking outside
  const modal = document.getElementById('bookingModal');
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Format card input
  const cardNumber = document.getElementById('cardNumber');
  if (cardNumber) {
    cardNumber.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      value = value.replace(/(.{4})/g, '$1 ').trim();
      e.target.value = value.substring(0, 19);
    });
  }

  // Format expiry date
  const expiry = document.getElementById('expiry');
  if (expiry) {
    expiry.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
      }
      e.target.value = value.substring(0, 5);
    });
  }

  // Format CVV
  const cvv = document.getElementById('cvv');
  if (cvv) {
    cvv.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
    });
  }

  // Format M-PESA number
  const phone = document.getElementById('phone');
  if (phone) {
    phone.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (!value.startsWith('254')) {
        value = '254' + value;
      }
      e.target.value = value.substring(0, 12);
    });
  }
}

/* UI TOGGLES */
function showLogin() {
  document.getElementById("auth").style.display = "block";
  document.getElementById("login").style.display = "block";
  document.getElementById("register").style.display = "none";
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("admin").style.display = "none";
}

function showRegister() {
  document.getElementById("login").style.display = "none";
  document.getElementById("register").style.display = "block";
}


function showDashboard() {
  document.getElementById("auth").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("admin").style.display = "none";
  document.getElementById("userDisplay").textContent = currentUser.username;
  getMyBookings();
  document.querySelector("main").style.display = "block"; // Ensure main content is visible
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem("gc_token");
  localStorage.removeItem("gc_user");
  showLogin();
}

/* AUTH */
async function handleRegister(e) {
  e.preventDefault();
  const email = document.getElementById("reg-email").value.trim();
  const username = document.getElementById("reg-username").value.trim();
  const password = document.getElementById("reg-password").value;
  const confirm = document.getElementById("reg-confirm").value;
  if (password !== confirm) return alert("Passwords do not match");

  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password })
    });
    const j = await res.json();
    if (!res.ok) return alert(j.error || "Registration failed");
    alert("Registered — please log in");
    showLogin();
  } catch (err) { console.error(err); alert("Network error"); }
}

async function handleLogin(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button');
  const usernameOrEmail = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  if (!usernameOrEmail || !password) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernameOrEmail, password })
    });
    const j = await res.json();
    
    if (!res.ok) {
      showToast(j.error || "Login failed", 'error');
      return;
    }

    token = j.token;
    currentUser = j.user;
    localStorage.setItem("gc_token", token);
    localStorage.setItem("gc_user", JSON.stringify(currentUser));
    
    showToast('Login successful!', 'success');
    
    if (currentUser.role === "admin") {
      showAdmin();
    } else {
      showDashboard();
    }
  } catch (err) {
    console.error(err);
    showToast('Network error during login', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Login';
  }
}

/* FETCH CONTENT */
async function fetchAllSections() {
  await Promise.all([fetchMovies(), fetchConcerts(), fetchPlays()]);
}

async function fetchMovies() {
  try {
    const res = await fetch(`${API_BASE}/movies`);
    const data = await res.json();
    allMedia.movies = data;
    renderSection("movies", data, "Movie");
  } catch (err) { console.error(err); }
}

async function fetchConcerts() {
  try {
    const res = await fetch(`${API_BASE}/concerts`);
    const data = await res.json();
    allMedia.concerts = data;
    renderSection("concerts", data, "Concert");
  } catch (err) { console.error(err); }
}

async function fetchPlays() {
  try {
    const res = await fetch(`${API_BASE}/plays`);
    const data = await res.json();
    allMedia.plays = data;
    renderSection("plays", data, "Play");
  } catch (err) { console.error(err); }
}

/* RENDER */
function renderSection(containerId, items, type) {
  const container = document.getElementById(containerId);
  container.innerHTML = items.map(i => `
    <div class="card">
      <img src="${i.poster || 'placeholder.jpg'}" alt="${i.title}" />
      <h4>${i.title}</h4>
      <p><small>${type}</small></p>
      <p>${i.description || ""}</p>
      <p><small>Duration: ${i.duration || "—"} min</small></p>
      <button onclick='bookPrompt(${i.id}, "${escapeJs(i.title)}")'>Book</button>
    </div>
  `).join("");
}

function escapeJs(s) { return s.replace(/"/g, '\\"'); }

/* BOOKINGS with seat selection + M-Pesa */
async function bookPrompt(id, title, category) {
  if (!token) { 
    showToast("Please login to book", "info"); 
    showLogin(); 
    return; 
  }

  // Show booking modal
  const modal = document.getElementById("bookingModal");
  const eventDetails = document.getElementById("eventDetails");
  modal.style.display = "block";

  // Set event details and prices based on category
  let prices;
  switch (category) {
    case 'movie':
      prices = { vvip: 5000, vip: 3000, regular: 1500 };
      break;
    case 'concert':
      prices = { vvip: 8000, vip: 5000, regular: 2500 };
      break;
    case 'play':
      prices = { vvip: 6000, vip: 4000, regular: 2000 };
      break;
    default:
      prices = { vvip: 5000, vip: 3000, regular: 1500 };
  }

  eventDetails.innerHTML = `
    <h3>${title}</h3>
    <p>Event Type: ${category.charAt(0).toUpperCase() + category.slice(1)}</p>
  `;

  // Update radio buttons with correct prices
  document.querySelector('label[for="vvip"]').textContent = `VVIP - KES ${prices.vvip}`;
  document.querySelector('label[for="vip"]').textContent = `VIP - KES ${prices.vip}`;
  document.querySelector('label[for="regular"]').textContent = `Regular - KES ${prices.regular}`;

  // Store event info and prices for later use
  modal.dataset.eventId = id;
  modal.dataset.eventTitle = title;
  modal.dataset.eventType = category;
  modal.dataset.prices = JSON.stringify(prices);

  // Reset form
  document.querySelectorAll('input[name="seatCategory"]').forEach(input => input.checked = false);
  document.querySelectorAll('input[name="paymentMethod"]').forEach(input => input.checked = false);
  document.getElementById('quantity').value = "1";
  document.getElementById('totalAmount').textContent = "KES 0";
  document.getElementById('mpesaForm').style.display = "none";
  document.getElementById('cardForm').style.display = "none";
}

/* BOOKINGS */
function showBookingModal(title, category) {
    if (!token) {
        showToast("Please login first", "error");
        showLogin();
        return;
    }

    const prices = PRICES[category];
    currentBooking = { title, category, prices };
    
    // Update modal content
    const modal = document.getElementById('bookingModal');
    const eventDetails = document.getElementById('eventDetails');
    
    eventDetails.innerHTML = `
        <h3>${title}</h3>
        <p>Event Type: ${category.charAt(0).toUpperCase() + category.slice(1)}</p>
    `;

    // Update price labels
    document.querySelector('label[for="vvip"]').textContent = `VVIP - KES ${prices.vvip}`;
    document.querySelector('label[for="vip"]').textContent = `VIP - KES ${prices.vip}`;
    document.querySelector('label[for="regular"]').textContent = `Regular - KES ${prices.regular}`;

    // Reset form
    document.querySelectorAll('input[name="seatCategory"]').forEach(input => input.checked = false);
    document.querySelectorAll('input[name="paymentMethod"]').forEach(input => input.checked = false);
    document.getElementById('quantity').value = "1";
    document.getElementById('totalAmount').textContent = "KES 0";
    document.getElementById('mpesaForm').style.display = "none";
    document.getElementById('cardForm').style.display = "none";

    // Show modal
    modal.style.display = "block";
}

function updateTotal() {
    if (!currentBooking) return;
    
    const selectedCategory = document.querySelector('input[name="seatCategory"]:checked');
    const quantity = parseInt(document.getElementById('quantity').value) || 0;
    
    if (selectedCategory && quantity > 0) {
        const price = currentBooking.prices[selectedCategory.value];
        const total = price * quantity;
        document.getElementById('totalAmount').textContent = `KES ${total}`;
    } else {
        document.getElementById('totalAmount').textContent = 'KES 0';
    }
}

function closeModal() {
    const modal = document.getElementById('bookingModal');
    modal.style.display = "none";
    currentBooking = null;
}

async function getMyBookings() {
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/my-bookings`, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    const data = await res.json();
    
    const container = document.getElementById("userBookings");
    if (!data.length) {
      container.innerHTML = "<p>No bookings found.</p>";
      return;
    }
    
    container.innerHTML = data.map(booking => `
      <div class="booking-card">
        <h4>${booking.eventTitle || booking.movie_title}</h4>
        <p>Type: ${booking.eventType || 'Movie'}</p>
        <p>Category: ${booking.category || 'Regular'}</p>
        <p>Quantity: ${booking.quantity || booking.seats.length}</p>
        <p>Amount: KES ${booking.amount || booking.seats.length * 1500}</p>
        <p>Status: ${booking.status || 'Completed'}</p>
        <p>Booked on: ${new Date(booking.created_at).toLocaleDateString()}</p>
        <button onclick="downloadTicket(${JSON.stringify(booking)})">Download Ticket</button>
      </div>
    `).join('');
  } catch (err) { 
    console.error(err); 
    showToast("Failed to load bookings", "error");
  }
}

async function processPayment() {
    if (!token || !currentBooking) {
        showToast("Please login to complete booking", "error");
        return;
    }

      const selectedCategory = document.querySelector('input[name="seatCategory"]:checked');
    const quantity = parseInt(document.getElementById('quantity').value);
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');

  if (!selectedCategory) {
    showToast("Please select a seating category", "error");
    return;
  }

  if (!paymentMethod) {
    showToast("Please select a payment method", "error");
    return;
  }

  const prices = JSON.parse(modal.dataset.prices);
  const totalAmount = prices[selectedCategory.value] * quantity;

  try {
    let paymentData;
    if (paymentMethod.value === 'mpesa') {
      const phone = document.getElementById('phone').value.trim();
      if (!/^254[0-9]{9}$/.test(phone)) {
        showToast("Please enter a valid M-PESA number (254XXXXXXXXX)", "error");
        return;
      }
      paymentData = { phone, amount: totalAmount };
    } else {
      const cardNumber = document.getElementById('cardNumber').value.trim();
      const expiry = document.getElementById('expiry').value.trim();
      const cvv = document.getElementById('cvv').value.trim();
      
      if (!cardNumber || !expiry || !cvv) {
        showToast("Please fill in all card details", "error");
        return;
      }
      paymentData = { cardNumber, expiry, cvv, amount: totalAmount };
    }

    // Create booking
    const bookingRes = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        eventId,
        eventTitle,
        eventType,
        category: selectedCategory.value,
        quantity,
        amount: totalAmount,
        paymentMethod: paymentMethod.value,
      })
    });

    const bookingData = await bookingRes.json();
    if (!bookingRes.ok) throw new Error(bookingData.error);

    // Process payment
    const payRes = await fetch(`${API_BASE}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...paymentData,
        bookingId: bookingData.bookingId
      })
    });

    const payData = await payRes.json();
    if (!payRes.ok) throw new Error(payData.error);

    showToast(
      paymentMethod.value === 'mpesa' 
        ? "M-PESA prompt sent. Complete payment on your phone." 
        : "Payment successful!",
      "success"
    );
    closeModal();
    getMyBookings(); // Refresh bookings

  } catch (err) {
    showToast(err.message || "Payment failed. Please try again.", "error");
  }
}

/* TICKET PDF */
function downloadTicket(booking) {
  const ticketHtml = `
    <div id="ticket" style="padding: 20px; background: #1a1a1a; color: #fff; border-radius: 8px; max-width: 400px; margin: 0 auto;">
      <h2 style="color: gold; text-align: center;">🎟 Gold Cinema Ticket</h2>
      <div style="border: 1px solid gold; padding: 15px; border-radius: 4px;">
        <p><b style="color: gold;">Event:</b> ${booking.eventTitle || booking.movie_title}</p>
        <p><b style="color: gold;">Type:</b> ${booking.eventType || 'Movie'}</p>
        <p><b style="color: gold;">Category:</b> ${booking.category || 'Regular'}</p>
        ${booking.seats ? `<p><b style="color: gold;">Seats:</b> ${booking.seats.join(", ")}</p>` : ''}
        ${booking.quantity ? `<p><b style="color: gold;">Tickets:</b> ${booking.quantity}</p>` : ''}
        <p><b style="color: gold;">Amount:</b> KES ${booking.amount || (booking.seats ? booking.seats.length * 1500 : 0)}</p>
        <p><b style="color: gold;">Date:</b> ${new Date(booking.created_at).toLocaleString()}</p>
        <p><b style="color: gold;">Customer:</b> ${currentUser.username}</p>
        <p style="text-align: center; margin-top: 20px; font-size: 0.8em;">
          Thank you for choosing Gold Cinema!<br>
          <span style="color: gold;">✨ Enjoy the show! ✨</span>
        </p>
      </div>
    </div>
  `;

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = ticketHtml;
  document.body.appendChild(tempDiv);

  html2pdf()
    .from(tempDiv.firstChild)
    .save(`gold-cinema-ticket-${Date.now()}.pdf`)
    .then(() => {
      document.body.removeChild(tempDiv);
    });
}

/* NOTIFICATIONS */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove after display
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ADMIN */
async function showAdmin() {
  document.getElementById("auth").style.display = "none";
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("admin").style.display = "block";
  document.getElementById("userDisplay").textContent = currentUser.username;
  try {
    const [usersRes, bookingsRes] = await Promise.all([
      fetch(`${API_BASE}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/admin/bookings`, { headers: { Authorization: `Bearer ${token}` } })
    ]);
    const users = await usersRes.json();
    const bookings = await bookingsRes.json();

    // Update report counts
    document.getElementById("totalUsersCount").textContent = users.length;
    document.getElementById("totalBookingsCount").textContent = bookings.length;

    // Populate tables
    document.getElementById("allCustomers").innerHTML = users.map(u =>
      `<p>${u.username} (${u.email}) [${u.role}]</p>`).join("");
    document.getElementById("allBookings").innerHTML = bookings.map(b =>
      `<p>${b.movie_title} — ${b.username} (${b.email}) — seats:${b.seats.join(", ")} — ${new Date(b.created_at).toLocaleString()}</p>`
    ).join("");
  } catch (err) { console.error(err); alert("Failed to load admin data"); }
}

async function handleAddMedia(e) {
  e.preventDefault();
  const title = document.getElementById("media-title").value;
  const category = document.getElementById("media-category").value;
  const description = document.getElementById("media-description").value;
  const poster = document.getElementById("media-poster").value;
  const duration = document.getElementById("media-duration").value;

  const mediaData = { title, category, description, poster, duration: parseInt(duration) || null };

  try {
    const res = await fetch(`${API_BASE}/admin/media`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(mediaData)
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || "Failed to add media");
    }

    showToast("Media added successfully!", "success");
    document.getElementById("addMediaForm").reset();
    // Optionally, refresh the media lists on the main page
    fetchAllSections();
  } catch (err) {
    console.error(err);
    showToast(err.message, "error");
  }
}
// End of script.js