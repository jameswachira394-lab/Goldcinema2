const API_BASE = "http://localhost:4000/api";
let token = localStorage.getItem("gc_token");
let currentUser = JSON.parse(localStorage.getItem("gc_user"));
let allMedia = { movies: [], concerts: [], plays: [] };
let currentCategory = "movies";

document.addEventListener("DOMContentLoaded", () => {
  if (token && currentUser) showDashboard();
  else showLogin();
  fetchAllSections();
});

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
  const usernameOrEmail = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernameOrEmail, password })
    });
    const j = await res.json();
    if (!res.ok) return alert(j.error || "Login failed");
    token = j.token;
    currentUser = j.user;
    localStorage.setItem("gc_token", token);
    localStorage.setItem("gc_user", JSON.stringify(currentUser));
    if (currentUser.role === "admin") showAdmin();
    else showDashboard();
  } catch (err) { console.error(err); alert("Network error during login"); }
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
      <img src="${i.poster_url || 'placeholder.jpg'}" alt="${i.title}" />
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
async function bookPrompt(id, title) {
  if (!token) { alert("Please login to book"); showLogin(); return; }

  document.querySelector("main").style.display = "none";
  const seatContainer = document.createElement("div");
  seatContainer.id = "seat-selection";
  seatContainer.innerHTML = `
    <h2>Select Seats for ${title}</h2>
    <div id="seat-grid" style="display:grid;grid-template-columns:repeat(8,40px);gap:8px;justify-content:center;margin:20px;">
      ${Array.from({ length: 40 }, (_, i) => `<div class="seat" data-seat="${i+1}">${i+1}</div>`).join("")}
    </div>
    <input id="mpesaPhone" placeholder="Enter M-Pesa phone (2547...)" style="margin:10px; padding:5px;">
    <button id="confirmSeats">Pay & Book</button>
    <button id="cancelBooking">Cancel</button>
  `;
  document.body.appendChild(seatContainer);

  const style = document.createElement("style");
  style.innerHTML = `
    .seat { width: 40px; height: 40px; background: #ccc; border-radius: 6px; display:flex;align-items:center;justify-content:center; cursor:pointer; }
    .seat.selected { background: #4CAF50; color:white; }
    .seat.booked { background: #555; color:white; cursor:not-allowed; }
  `;
  document.head.appendChild(style);

  let bookedSeats = [];
  try {
    const res = await fetch(`${API_BASE}/booked-seats/${id}`);
    if (res.ok) bookedSeats = await res.json();
  } catch (err) { console.error(err); }

  document.querySelectorAll(".seat").forEach(seat => {
    const seatNum = seat.dataset.seat;
    if (bookedSeats.includes(seatNum)) seat.classList.add("booked");
    else seat.addEventListener("click", () => seat.classList.toggle("selected"));
  });

  document.getElementById("confirmSeats").onclick = async () => {
    const selected = [...document.querySelectorAll(".seat.selected")].map(s => s.dataset.seat);
    const phone = document.getElementById("mpesaPhone").value.trim();
    if (selected.length === 0) return alert("Select at least one seat.");
    if (!phone) return alert("Enter M-Pesa phone number.");

    try {
      const payRes = await fetch(`${API_BASE}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone, amount: selected.length * 500, movie_id: id, seats: selected })
      });
      const payData = await payRes.json();
      if (!payRes.ok) return alert(payData.error || "Payment failed");
      alert("Check your phone for M-Pesa prompt and confirm payment.");
    } catch (err) { console.error(err); alert("M-Pesa payment failed."); }

    seatContainer.remove();
    document.querySelector("main").style.display = "block";
  };

  document.getElementById("cancelBooking").onclick = () => {
    seatContainer.remove();
    document.querySelector("main").style.display = "block";
  };
}

/* BOOKINGS */
async function getMyBookings() {
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/my-bookings`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    const container = document.getElementById("myBookings");
    container.innerHTML = data.map(b =>
      `<p>${b.movie_title} — seats: ${b.seats.join(", ")} — ${new Date(b.created_at).toLocaleString()}</p>`
    ).join("");
    if (data[0]) renderTicket(data[0]);
  } catch (err) { console.error(err); }
}

/* TICKET PDF */
function renderTicket(b) {
  const ticketArea = document.getElementById("ticketArea");
  ticketArea.innerHTML = `
    <div id="ticket">
      <h4>🎟 Gold Cinema Ticket</h4>
      <p><b>Movie:</b> ${b.movie_title}</p>
      <p><b>Seats:</b> ${b.seats.join(", ")}</p>
      <p><b>When:</b> ${new Date(b.created_at).toLocaleString()}</p>
      <p><b>Customer:</b> ${currentUser.username}</p>
    </div>
    <button onclick="downloadTicket()">Download PDF</button>
  `;
}

function downloadTicket() {
  const ticket = document.getElementById("ticket");
  if (!ticket) return;
  html2pdf().from(ticket).save("ticket.pdf");
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
    document.getElementById("allCustomers").innerHTML = users.map(u =>
      `<p>${u.username} (${u.email}) [${u.role}]</p>`).join("");
    document.getElementById("allBookings").innerHTML = bookings.map(b =>
      `<p>${b.movie_title} — ${b.username} (${b.email}) — seats:${b.seats.join(", ")} — ${new Date(b.created_at).toLocaleString()}</p>`
    ).join("");
  } catch (err) { console.error(err); alert("Failed to load admin data"); }
}
// End of script.js