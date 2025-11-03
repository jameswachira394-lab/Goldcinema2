// Sample movie data (replace with actual API calls)
const movies = [
    {
        id: 1,
        title: "The Dark Knight",
        year: 2008,
        rating: 9.0,
        duration: 152,
        genre: "Action",
        synopsis: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
        poster: "https://example.com/dark-knight-poster.jpg",
        trailer: "EXeTwQWrcwY",
        cast: [
            {
                name: "Christian Bale",
                role: "Bruce Wayne / Batman",
                photo: "https://example.com/christian-bale.jpg"
            },
            // Add more cast members
        ],
        showtimes: ["10:00", "13:00", "16:00", "19:00", "22:00"]
    },
    // Add more movies
];

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
    loadFontAwesome();
    loadMovies();
    setupEventListeners();
});

function loadFontAwesome() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    document.head.appendChild(link);
}

function loadMovies() {
    const movieGrid = document.querySelector('#movies .movie-grid');
    movies.forEach(movie => {
        const card = createMovieCard(movie);
        movieGrid.appendChild(card);
    });
}

function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
        <img src="${movie.poster}" alt="${movie.title}">
        <div class="movie-card-info">
            <h3 class="movie-card-title">${movie.title}</h3>
            <div class="movie-card-meta">
                <span>${movie.genre}</span>
                <span>${movie.duration} min</span>
            </div>
        </div>
    `;
    card.addEventListener('click', () => showMovieDetails(movie.id));
    return card;
}

// Search and Filter Functions
function performSearch() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const genre = document.getElementById('genreFilter').value;
    const date = document.getElementById('dateFilter').value;
    const price = document.getElementById('priceFilter').value;
    
    filterMedia(searchQuery, category, genre, date, price);
}

function filterMedia(query, category, genre, date, price) {
    const cards = document.querySelectorAll('.movie-card');
    cards.forEach(card => {
        const title = card.querySelector('.movie-card-title').textContent.toLowerCase();
        const cardGenre = card.querySelector('.movie-card-meta span:first-child').textContent.toLowerCase();
        
        let show = true;
        
        if (query && !title.includes(query)) show = false;
        if (genre !== 'all' && cardGenre !== genre.toLowerCase()) show = false;
        
        card.style.display = show ? 'block' : 'none';
    });
}

// Movie Details Functions
function showMovieDetails(movieId) {
    const movie = movies.find(m => m.id === movieId);
    if (!movie) return;
    
    document.getElementById('modalMovieTitle').textContent = movie.title;
    document.getElementById('modalMovieYear').textContent = movie.year;
    document.getElementById('modalMovieRating').textContent = `${movie.rating}/10`;
    document.getElementById('modalMovieDuration').textContent = `${movie.duration} min`;
    document.getElementById('modalMovieSynopsis').textContent = movie.synopsis;
    document.getElementById('modalMoviePoster').src = movie.poster;
    
    const castHTML = movie.cast.map(actor => `
        <div class="cast-member">
            <img src="${actor.photo}" alt="${actor.name}">
            <p>${actor.name}</p>
            <small>${actor.role}</small>
        </div>
    `).join('');
    document.getElementById('modalMovieCast').innerHTML = castHTML;
    
    const timeSlotsHTML = movie.showtimes.map(time => `
        <button class="time-btn" onclick="selectShowtime('${movie.id}', '${time}')">${time}</button>
    `).join('');
    document.querySelector('.time-slots').innerHTML = timeSlotsHTML;
    
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

// Booking Functions
let currentBooking = {};

function selectShowtime(movieId, time) {
    const buttons = document.querySelectorAll('.time-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    currentBooking = {
        movieId: movieId,
        showtime: time,
        seats: []
    };
}

function startBooking() {
    if (!currentBooking.showtime) {
        alert('Please select a showtime first');
        return;
    }
    
    document.getElementById('movieDetailsModal').style.display = 'none';
    document.getElementById('bookingModal').style.display = 'block';
    loadSeatMap();
}

function loadSeatMap() {
    // Create a 10x10 seat map
    const seatMap = document.querySelector('.seat-selection');
    seatMap.innerHTML = '';
    
    for (let row = 0; row < 10; row++) {
        const seatRow = document.createElement('div');
        seatRow.className = 'seat-row';
        
        for (let col = 0; col < 10; col++) {
            const seat = document.createElement('div');
            seat.className = 'seat';
            seat.dataset.row = row;
            seat.dataset.col = col;
            seat.addEventListener('click', () => toggleSeat(seat));
            seatRow.appendChild(seat);
        }
        
        seatMap.appendChild(seatRow);
    }
    
    updateBookingSummary();
}

function toggleSeat(seat) {
    seat.classList.toggle('selected');
    const row = seat.dataset.row;
    const col = seat.dataset.col;
    const seatId = `${row}-${col}`;
    
    if (seat.classList.contains('selected')) {
        currentBooking.seats.push(seatId);
    } else {
        currentBooking.seats = currentBooking.seats.filter(id => id !== seatId);
    }
    
    updateBookingSummary();
}

function updateBookingSummary() {
    const summary = document.querySelector('.booking-summary');
    const movie = movies.find(m => m.id === currentBooking.movieId);
    
    summary.innerHTML = `
        <h3>Booking Summary</h3>
        <p>Movie: ${movie.title}</p>
        <p>Time: ${currentBooking.showtime}</p>
        <p>Seats: ${currentBooking.seats.length}</p>
        <p>Total: $${currentBooking.seats.length * 12}</p>
    `;
}

function closeBooking() {
    document.getElementById('bookingModal').style.display = 'none';
    currentBooking = {};
}

function proceedToPayment() {
    if (currentBooking.seats.length === 0) {
        alert('Please select at least one seat');
        return;
    }
    
    // Implement payment gateway integration here
    alert('Redirecting to payment gateway...');
}