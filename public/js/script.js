// Movie Data
const movies = [
    {
        id: 1,
        title: "Cyberpunk Odyssey",
        year: 2023,
        rating: "PG-13",
        duration: "2h 15min",
        genre: "Sci-Fi",
        poster: "images/movie1.jpg",
        synopsis: "In a neon-lit future, a lone hacker discovers a conspiracy that could change the fate of humanity.",
        cast: [
            { name: "John Neo", role: "Marcus Chen", image: "images/cast1.jpg" },
            { name: "Sarah Digital", role: "Ada-7", image: "images/cast2.jpg" }
        ],
        showtimes: ["10:00 AM", "2:30 PM", "6:00 PM", "9:30 PM"]
    },
    // Add more movies here
];

// DOM Elements
let currentMovie = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadMovies();
    setupEventListeners();
});

// Load Movies
function loadMovies() {
    const movieGrid = document.querySelector('.movie-grid');
    movies.forEach(movie => {
        const movieCard = createMovieCard(movie);
        movieGrid.appendChild(movieCard);
    });
}

// Create Movie Card
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
        <img src="${movie.poster}" alt="${movie.title}">
        <div class="movie-card-info">
            <h3 class="movie-card-title">${movie.title}</h3>
            <div class="movie-card-meta">
                <span><i class="fas fa-calendar"></i> ${movie.year}</span>
                <span><i class="fas fa-star"></i> ${movie.rating}</span>
            </div>
        </div>
    `;
    card.addEventListener('click', () => showMovieDetails(movie));
    return card;
}

// Show Movie Details
function showMovieDetails(movie) {
    currentMovie = movie;
    const modal = document.getElementById('movieDetailsModal');
    
    // Update modal content
    document.getElementById('modalMovieTitle').textContent = movie.title;
    document.getElementById('modalMoviePoster').src = movie.poster;
    document.getElementById('modalMovieYear').textContent = movie.year;
    document.getElementById('modalMovieRating').textContent = movie.rating;
    document.getElementById('modalMovieDuration').textContent = movie.duration;
    document.getElementById('modalMovieSynopsis').textContent = movie.synopsis;
    
    // Update cast
    const castGrid = document.getElementById('modalMovieCast');
    castGrid.innerHTML = movie.cast.map(member => `
        <div class="cast-member">
            <img src="${member.image}" alt="${member.name}">
            <p>${member.name}</p>
            <small>${member.role}</small>
        </div>
    `).join('');
    
    // Update showtimes
    const timeSlots = document.querySelector('.time-slots');
    timeSlots.innerHTML = movie.showtimes.map(time => `
        <button class="time-btn" onclick="selectTime(this)">${time}</button>
    `).join('');
    
    modal.style.display = 'block';
}

// Close Movie Details
function closeMovieDetails() {
    document.getElementById('movieDetailsModal').style.display = 'none';
    currentMovie = null;
}

// Select Time Slot
function selectTime(button) {
    const timeButtons = document.querySelectorAll('.time-btn');
    timeButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
}

// Start Booking Process
function startBooking() {
    if (!currentMovie) return;
    const selectedTime = document.querySelector('.time-btn.active');
    if (!selectedTime) {
        alert('Please select a show time first.');
        return;
    }
    
    const bookingModal = document.getElementById('bookingModal');
    const seatSelection = document.querySelector('.seat-selection');
    
    // Generate seat map
    seatSelection.innerHTML = generateSeatMap();
    bookingModal.style.display = 'block';
}

// Close Booking Modal
function closeBooking() {
    document.getElementById('bookingModal').style.display = 'none';
}

// Generate Seat Map
function generateSeatMap() {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const seatsPerRow = 12;
    let seatMap = '';
    
    rows.forEach(row => {
        seatMap += `<div class="seat-row">
            <span class="row-label">${row}</span>`;
        for (let i = 1; i <= seatsPerRow; i++) {
            seatMap += `<div class="seat" data-seat="${row}${i}" onclick="toggleSeat(this)"></div>`;
            if (i === seatsPerRow/2) seatMap += '<span class="aisle"></span>';
        }
        seatMap += '</div>';
    });
    
    return seatMap;
}

// Toggle Seat Selection
function toggleSeat(seat) {
    seat.classList.toggle('selected');
    updateBookingSummary();
}

// Update Booking Summary
function updateBookingSummary() {
    const selectedSeats = document.querySelectorAll('.seat.selected');
    const summaryDiv = document.querySelector('.booking-summary');
    const ticketPrice = 15; // Price per ticket
    
    const total = selectedSeats.length * ticketPrice;
    const seats = Array.from(selectedSeats).map(seat => seat.dataset.seat).join(', ');
    
    summaryDiv.innerHTML = `
        <h3>Booking Summary</h3>
        <p>Movie: ${currentMovie.title}</p>
        <p>Selected Seats: ${seats}</p>
        <p>Number of Tickets: ${selectedSeats.length}</p>
        <p>Total Price: $${total}</p>
    `;
}

// Proceed to Payment
function proceedToPayment() {
    const selectedSeats = document.querySelectorAll('.seat.selected');
    if (selectedSeats.length === 0) {
        alert('Please select at least one seat.');
        return;
    }
    
    // Implement payment gateway integration here
    alert('Redirecting to payment gateway...');
}

// Setup Event Listeners
function setupEventListeners() {
    // Close modals when clicking outside
    window.onclick = (event) => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    };
    
    // Search functionality
    document.querySelector('.search-btn').addEventListener('click', performSearch);
}

// Perform Search
function performSearch() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const genre = document.getElementById('genreFilter').value;
    const date = document.getElementById('dateFilter').value;
    const price = document.getElementById('priceFilter').value;
    
    // Filter movies based on search criteria
    const filteredMovies = movies.filter(movie => {
        const matchesSearch = movie.title.toLowerCase().includes(searchInput);
        const matchesCategory = category === 'all' || movie.category === category;
        const matchesGenre = genre === 'all' || movie.genre === genre;
        // Add more filter conditions as needed
        
        return matchesSearch && matchesCategory && matchesGenre;
    });
    
    // Update movie grid
    const movieGrid = document.querySelector('.movie-grid');
    movieGrid.innerHTML = '';
    filteredMovies.forEach(movie => {
        const movieCard = createMovieCard(movie);
        movieGrid.appendChild(movieCard);
    });
}