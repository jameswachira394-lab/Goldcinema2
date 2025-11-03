// Gold Cinema Frontend Logic
const API_BASE = "http://localhost:4000/api";
let TOKEN = localStorage.getItem("token") || "";
let USER = JSON.parse(localStorage.getItem("user") || "null");
let currentMovieId = null;

// ------------------ AUTH ------------------
function showLogin() {
  document.getElementById("auth").style.display = "block";
  document.getElementById("login").style.display = "block";
  document.getElementById("register").style.display = "none";
}
function showRegister() {
  document.getElementById("auth").style.display = "block";
  document.getElementById("login").style.display = "none";
  document.getElementById("register").style.display = "block";
}
function hideAuth() {
  document.getElementById("auth").style.display = "none";
}
async function handleRegister(e) {
  e.preventDefault();
  const email = document.getElementById("reg-email").value.trim();
  const username = document.getElementById("reg-username").value.trim();
  const password = document.getElementById("reg-password").value;
  const confirm = document.getElementById("reg-confirm").value;
  if (password !== confirm) return alert("Passwords do not match");
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });
  const data = await res.json();
  if (res.ok) {
    alert("Registered successfully");
    showLogin();
  } else alert(data.error || "Registration failed");
}
async function handleLogin(e) {
  e.preventDefault();
  const usernameOrEmail = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernameOrEmail, password }),
  });
  const data = await res.json();
  if (res.ok) {
    TOKEN = data.token;
    USER = data.user;
    localStorage.setItem("token", TOKEN);
    localStorage.setItem("user", JSON.stringify(USER));
    hideAuth();
    updateNav();
  } else alert(data.error || "Login failed");
}
function logout() {
  localStorage.clear();
  TOKEN = "";
  USER = null;
  updateNav();
}
function updateNav() {
  const authLinks = document.querySelectorAll(".auth-hidden");
  const userLinks = document.querySelectorAll(".user-hidden");
  if (USER) {
    authLinks.forEach(el => (el.style.display = "none"));
    userLinks.forEach(el => (el.style.display = "block"));
    document.getElementById("navUsername").textContent = USER.username;
  } else {
    authLinks.forEach(el => (el.style.display = "inline-block"));
    userLinks.forEach(el => (el.style.display = "none"));
  }
}
updateNav();

// ------------------ BOOKING + SEATS ------------------
const seatRows = 5;
const seatCols = 8;
let selectedSeats = [];
let seatPrice = 0;

function bookPrompt(movieTitle) {
  const main = document.querySelector("main");
  main.style.display = "none";

  const container = document.createElement("div");
  container.className = "seat-container";
  container.innerHTML = `
    <h2>Select Your Seats for ${movieTitle}</h2>
    <div class="seat-grid"></div>
    <div class="seat-info">
      <label>Seat Type:
        <select id="seatType">
          <option value="regular" data-price="1500">Regular - KES 1500</option>
          <option value="vip" data-price="3000">VIP - KES 3000</option>
          <option value="vvip" data-price="5000">VVIP - KES 5000</option>
        </select>
      </label>
      <p id="selectedSeats">Selected: none</p>
      <p id="totalPrice">Total: KES 0</p>
      <label>M-Pesa Number:
        <input id="phoneInput" placeholder="2547XXXXXXXX" pattern="254[0-9]{9}" required>
      </label>
      <br>
      <button id="confirmSeats">Confirm & Pay</button>
      <button id="cancelSeats">Cancel</button>
    </div>
  `;
  document.body.appendChild(container);

  const grid = container.querySelector(".seat-grid");
  for (let r = 0; r < seatRows; r++) {
    const row = document.createElement("div");
    row.className = "seat-row";
    for (let c = 0; c < seatCols; c++) {
      const seat = document.createElement("div");
      seat.className = "seat";
      seat.textContent = `${String.fromCharCode(65 + r)}${c + 1}`;
      seat.addEventListener("click", () => toggleSeat(seat));
      row.appendChild(seat);
    }
    grid.appendChild(row);
  }

  document.getElementById("seatType").addEventListener("change", updateTotal);
  document.getElementById("confirmSeats").onclick = () => confirmSeats(movieTitle);
  document.getElementById("cancelSeats").onclick = () => {
    container.remove();
    main.style.display = "block";
  };
}

function toggleSeat(seat) {
  const seatId = seat.textContent;
  if (seat.classList.contains("selected")) {
    seat.classList.remove("selected");
    selectedSeats = selectedSeats.filter(s => s !== seatId);
  } else {
    seat.classList.add("selected");
    selectedSeats.push(seatId);
  }
  updateTotal();
}

function updateTotal() {
  const seatTypeSelect = document.getElementById("seatType");
  if (!seatTypeSelect) return;
  seatPrice = parseInt(seatTypeSelect.selectedOptions[0].dataset.price, 10);
  const total = selectedSeats.length * seatPrice;
  document.getElementById("selectedSeats").textContent =
    `Selected: ${selectedSeats.join(", ") || "none"}`;
  document.getElementById("totalPrice").textContent = `Total: KES ${total}`;
}

// ------------------ PAYMENT ------------------
async function confirmSeats(movieTitle) {
  if (!USER) return alert("Please log in first.");
  if (selectedSeats.length === 0) return alert("Select at least one seat.");

  const phone = document.getElementById("phoneInput").value.trim();
  if (!/^254\d{9}$/.test(phone)) return alert("Enter valid M-Pesa number (2547XXXXXXXX)");

  const total = selectedSeats.length * seatPrice;
  const movie_id = 1; // Example, can be dynamic

  // Create booking first
  const bookRes = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ movie_id, seats: selectedSeats }),
  });
  const bookData = await bookRes.json();
  if (!bookRes.ok) return alert(bookData.error || "Booking failed");

  const bookingId = bookData.bookingId;

  // Trigger M-Pesa payment
  const payRes = await fetch(`${API_BASE}/pay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ phone, amount: total, movie_id, seats: selectedSeats, bookingId }),
  });

  const payData = await payRes.json();
  if (payRes.ok) {
    alert("M-Pesa prompt sent. Complete payment on your phone.");
    document.querySelector(".seat-container").remove();
    document.querySelector("main").style.display = "block";
  } else alert(payData.error || "Payment initiation failed");
}
