const API_BASE = "http://localhost:4000/api";
let token = localStorage.getItem("gc_token");
let currentUser = JSON.parse(localStorage.getItem("gc_user"));

document.addEventListener("DOMContentLoaded", () => {
  if (token && currentUser) showDashboard();
  else showLogin();
  fetchMovies();
});

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

/* UI toggles */
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

/* Auth */
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
  } catch (err) {
    console.error(err); alert("Network error");
  }
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
  } catch (err) {
    console.error(err); alert("Network error");
  }
}

function logout() {
  token = null; currentUser = null;
  localStorage.removeItem("gc_token"); localStorage.removeItem("gc_user");
  showLogin();
}

/* Movies */
async function fetchMovies() {
  try {
    const res = await fetch(`${API_BASE}/movies`);
    const movies = await res.json();
    renderMovies(movies);
  } catch (err) {
    console.error(err);
  }
}
function renderMovies(movies) {
  const container = document.getElementById("movies");
  container.innerHTML = movies.map(m => `
    <div class="card">
      <h4>${m.title}</h4>
      <p><small>${m.category}</small></p>
      <p>${m.description || ""}</p>
      <p><small>Duration: ${m.duration || "—"} min</small></p>
      <button onclick='bookPrompt(${m.id}, "${escapeJs(m.title)}")'>Book</button>
    </div>
  `).join("");
}
function escapeJs(s) { return s.replace(/"/g, '\\"'); }

/* Booking */
async function bookPrompt(movieId, title) {
  if (!token) { alert("Please login to book"); showLogin(); return; }
  const seats = prompt(`Enter seats to book for "${title}" (comma separated, e.g. A1,A2):`);
  if (!seats) return;
  try {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ movie_id: movieId, seats: seats.split(",").map(s => s.trim()) })
    });
    const j = await res.json();
    if (!res.ok) return alert(j.error || "Booking failed");
    alert("Booking successful");
    getMyBookings();
  } catch (err) { console.error(err); alert("Network error"); }
}

async function getMyBookings() {
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/my-bookings`, { headers: { Authorization: `Bearer ${token}` }});
    const data = await res.json();
    const container = document.getElementById("myBookings");
    container.innerHTML = data.map(b => `<p>${b.movie_title} — seats: ${b.seats.join(", ")} — ${new Date(b.created_at).toLocaleString()}</p>`).join("");
    if (data[0]) renderTicket(data[0]);
  } catch (err) { console.error(err); }
}

/* Ticket rendering & download */
function renderTicket(booking) {
  const ticketArea = document.getElementById("ticketArea");
  ticketArea.innerHTML = `
    <div id="ticket">
      <h4>🎟 Gold Cinema Ticket</h4>
      <p><b>Movie:</b> ${booking.movie_title}</p>
      <p><b>Seats:</b> ${booking.seats.join(", ")}</p>
      <p><b>When:</b> ${new Date(booking.created_at).toLocaleString()}</p>
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

/* Admin */
async function showAdmin() {
  document.getElementById("auth").style.display = "none";
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("admin").style.display = "block";
  document.getElementById("userDisplay").textContent = currentUser.username;
  // fetch users and bookings
  try {
    const [usersRes, bookingsRes] = await Promise.all([
      fetch(`${API_BASE}/admin/users`, { headers: { Authorization: `Bearer ${token}` }}),
      fetch(`${API_BASE}/admin/bookings`, { headers: { Authorization: `Bearer ${token}` }})
    ]);
    const users = await usersRes.json();
    const bookings = await bookingsRes.json();
    document.getElementById("allCustomers").innerHTML = users.map(u => `<p>${u.username} (${u.email}) [${u.role}]</p>`).join("");
    document.getElementById("allBookings").innerHTML = bookings.map(b => `<p>${b.movie_title} — ${b.username} (${b.email}) — seats:${b.seats.join(", ")} — ${new Date(b.created_at).toLocaleString()}</p>`).join("");
  } catch (err) { console.error(err); alert("Failed to load admin data"); }
}
