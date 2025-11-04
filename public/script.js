const API_BASE = "http://localhost:3000/api";
let token = localStorage.getItem("gc_token");
let currentUser = JSON.parse(localStorage.getItem("gc_user"));
let currentBooking = null;

// In-memory store for media
const allMedia = { movies: [], concerts: [], plays: [] };

// Default prices
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
  fetchAllSections();
});

/* ------------------ SAFE STUBS ------------------ */
function setupEventListeners() {}
function setupPaymentUIListeners() {}
function updateAuthUI() {}

/* ------------------ HELPERS ------------------ */
function loadFontAwesome() {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css";
  document.head.appendChild(link);
}

/* ------------------ SEARCH & FILTER ------------------ */
function performSearch() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const cards = document.querySelectorAll(".card");

  cards.forEach(card => {
    const title = card.querySelector("h4").textContent.toLowerCase();
    const section = card.closest("section").id;
    let visible = true;

    if (q && !title.includes(q)) visible = false;
    if (category !== "all" && !section.includes(category)) visible = false;

    card.style.display = visible ? "block" : "none";
  });
}

/* ------------------ MOVIE DETAILS ------------------ */
function showMovieDetails(title) {
  const movie = getMovieDetails(title);
  if (!movie) return showToast("Movie not found", "error");

  document.getElementById("modalMovieTitle").textContent = movie.title || "";
  document.getElementById("modalMovieDuration").textContent = `${movie.duration || "—"} min`;
  document.getElementById("modalMoviePoster").src = movie.poster || "images/default-movie.jpg";
  document.getElementById("modalMovieSynopsis").textContent = movie.description || "";

  document.getElementById("movieDetailsModal").style.display = "block";
}

function getMovieDetails(title) {
  return allMedia.movies.find(m => m.title === title);
}

function closeMovieDetails() {
  document.getElementById("movieDetailsModal").style.display = "none";
}

/* ------------------ TRAILER ------------------ */
function showTrailer(videoId) {
  const player = document.getElementById("trailerPlayer");
  player.innerHTML = `
    <iframe
      src="https://www.youtube.com/embed/${videoId}?autoplay=1"
      frameborder="0"
      allow="autoplay; encrypted-media"
      allowfullscreen
    ></iframe>
  `;
  document.getElementById("trailerModal").style.display = "block";
}

function closeTrailer() {
  document.getElementById("trailerPlayer").innerHTML = "";
  document.getElementById("trailerModal").style.display = "none";
}

/* ------------------ AUTH ------------------ */
function updateAuthStatus() {
  const authLinks = document.querySelectorAll(".auth-hidden");
  const userLinks = document.querySelectorAll(".user-hidden");

  if (token && currentUser) {
    authLinks.forEach(el => el.style.display = "none");
    userLinks.forEach(el => el.style.display = "block");
    document.getElementById("navUsername").textContent = currentUser.username;
  } else {
    authLinks.forEach(el => el.style.display = "inline-block");
    userLinks.forEach(el => el.style.display = "none");
  }
}

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

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem("gc_token");
  localStorage.removeItem("gc_user");
  showLogin();
  updateAuthStatus();
}

/* ------------------ REGISTER ------------------ */
async function handleRegister(e) {
  e.preventDefault();
  const email = document.getElementById("reg-email").value.trim();
  const username = document.getElementById("reg-username").value.trim();
  const password = document.getElementById("reg-password").value;
  const confirm = document.getElementById("reg-confirm").value;
  if (password !== confirm) return showToast("Passwords do not match", "error");

  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    showToast("Registered successfully! Please log in.", "success");
    showLogin();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/* ------------------ LOGIN ------------------ */
async function handleLogin(e) {
  e.preventDefault();
  const usernameOrEmail = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernameOrEmail, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    token = data.token;
    currentUser = data.user;
    localStorage.setItem("gc_token", token);
    localStorage.setItem("gc_user", JSON.stringify(currentUser));

    showToast("Login successful!", "success");
    currentUser.role === "admin" ? showAdmin() : showDashboard();
  } catch (err) {
    showToast(err.message, "error");
  }
}

/* ------------------ DASHBOARD ------------------ */
function showDashboard() {
  document.getElementById("auth").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("admin").style.display = "none";
  document.getElementById("userDisplay").textContent = currentUser.username;
  getMyBookings();
}

/* ------------------ FETCH DATA ------------------ */
async function fetchAllSections() {
  await Promise.all([fetchMovies(), fetchConcerts(), fetchPlays()]);
}

async function fetchMovies() {
  try {
    const res = await fetch(`${API_BASE}/movies`);
    const data = await res.json();
    allMedia.movies = data;
    renderSection("movies-section", data, "Movie");
  } catch (err) {
    console.error("Movies fetch error:", err);
  }
}

async function fetchConcerts() {
  try {
    const res = await fetch(`${API_BASE}/events`);
    const data = await res.json();
    allMedia.concerts = data;
    renderSection("concerts-section", data, "Concert");
  } catch (err) {
    console.error("Concerts fetch error:", err);
  }
}

async function fetchPlays() {
  try {
    const res = await fetch(`${API_BASE}/plays`);
    const data = await res.json();
    allMedia.plays = data;
    renderSection("plays-section", data, "Play");
  } catch (err) {
    console.error("Plays fetch error:", err);
  }
}

/* ------------------ RENDER ------------------ */
function renderSection(id, items, type) {
  const container = document.querySelector(`#${id} .media-grid`);
  if (!container) return;
  container.innerHTML = (items || []).map(i => `
    <div class="card">
      <img src="${i.poster || 'images/default-movie.jpg'}" alt="${i.title}" />
      <h4>${i.title}</h4>
      <p>${i.description || ""}</p>
      <p><small>${type}</small></p>
      <button onclick="showBookingModal('${i.title}', '${type.toLowerCase()}')">Book Now</button>
    </div>
  `).join("");
}

/* ------------------ BOOKINGS ------------------ */
function showBookingModal(title, category) {
  if (!token) {
    showToast("Please log in to book", "error");
    showLogin();
    return;
  }

  currentBooking = { title, category, prices: PRICES[category] };
  const modal = document.getElementById("bookingModal");
  const eventDetails = document.getElementById("eventDetails");
  const prices = PRICES[category];

  eventDetails.innerHTML = `<h3>${title}</h3><p>${category.toUpperCase()}</p>`;
  document.querySelector('label[for="vvip"]').textContent = `VVIP - KES ${prices.vvip}`;
  document.querySelector('label[for="vip"]').textContent = `VIP - KES ${prices.vip}`;
  document.querySelector('label[for="regular"]').textContent = `Regular - KES ${prices.regular}`;

  document.getElementById("quantity").value = 1;
  document.getElementById("totalAmount").textContent = "KES 0";
  modal.style.display = "block";
}

function updateTotal() {
  if (!currentBooking) return;
  const seat = document.querySelector('input[name="seatCategory"]:checked');
  const qty = parseInt(document.getElementById("quantity").value) || 0;
  const total = seat ? currentBooking.prices[seat.value] * qty : 0;
  document.getElementById("totalAmount").textContent = `KES ${total}`;
}

function closeModal() {
  document.getElementById("bookingModal").style.display = "none";
  currentBooking = null;
}

/* ------------------ PAYMENT ------------------ */
async function processPayment() {
  if (!token || !currentBooking) return showToast("Login to complete booking", "error");

  const seat = document.querySelector('input[name="seatCategory"]:checked');
  const qty = parseInt(document.getElementById("quantity").value);
  const payMethod = document.querySelector('input[name="paymentMethod"]:checked');
  if (!seat || !payMethod) return showToast("Select category and payment method", "error");

  const total = currentBooking.prices[seat.value] * qty;
  showToast("Processing payment...", "info");

  try {
    await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: currentBooking.title, category: seat.value, quantity: qty, amount: total })
    });
    showToast("Payment successful!", "success");
    closeModal();
    getMyBookings();
  } catch {
    showToast("Payment failed", "error");
  }
}

/* ------------------ BOOKINGS LIST ------------------ */
async function getMyBookings() {
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/my-bookings`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    document.getElementById("userBookings").innerHTML =
      data.length === 0
        ? "<p>No bookings found.</p>"
        : data.map(b => `<div><h4>${b.eventTitle}</h4><p>${b.category}</p><p>KES ${b.amount}</p></div>`).join("");
  } catch {
    showToast("Failed to load bookings", "error");
  }
}

/* ------------------ ADMIN ------------------ */
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

    document.getElementById("totalUsersCount").textContent = users.length;
    document.getElementById("totalBookingsCount").textContent = bookings.length;
  } catch {
    showToast("Admin data failed to load", "error");
  }
}

/* ------------------ TOAST ------------------ */
function showToast(message, type = "info") {
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 300);
  }, 3000);
}
function showLoader() {
  document.getElementById("loaderOverlay").style.display = "flex";
}

function hideLoader() {
  document.getElementById("loaderOverlay").style.display = "none";
}
async function fetchMovies() {
  showLoader();
  try {
    const res = await fetch(`${API_BASE}/movies`);
    const data = await res.json();
    renderSection("movies-section", data, "Movie");
  } catch (e) {
    console.error(e);
  } finally {
    hideLoader();
  }
}
