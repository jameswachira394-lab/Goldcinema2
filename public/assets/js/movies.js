// Movie data management and UI functions
let currentMovies = [];

// Load movies when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadMovies();
});

// Fetch and display movies
async function loadMovies() {
    try {
        const movies = await api.getMovies();
        currentMovies = movies;
        displayMovies(movies);
    } catch (error) {
        showNotification('Error loading movies', 'error');
    }
}

// Display movies in the grid
function displayMovies(movies) {
    const movieGrid = document.getElementById('movieGrid');
    if (!movieGrid) return;

    movieGrid.innerHTML = movies.map(movie => `
        <div class="movie-card" onclick="showMovieDetails(${movie.id})">
            <div class="movie-poster">
                <img src="${movie.poster}" alt="${movie.title}">
                <div class="movie-overlay">
                    <button class="watch-trailer" onclick="playTrailer('${movie.trailerId}', event)">
                        <i class="fas fa-play"></i> Watch Trailer
                    </button>
                </div>
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <div class="movie-meta">
                    <span><i class="fas fa-star"></i> ${movie.rating}</span>
                    <span><i class="fas fa-clock"></i> ${movie.duration} min</span>
                </div>
                <div class="movie-genre">${movie.genre}</div>
            </div>
        </div>
    `).join('');
}

// Show movie details in modal
async function showMovieDetails(movieId) {
    try {
        const movie = await api.getMovieById(movieId);
        const modal = document.getElementById('movieModal');
        const modalContent = modal.querySelector('.movie-details');

        modalContent.innerHTML = `
            <div class="movie-poster">
                <img src="${movie.poster}" alt="${movie.title}">
            </div>
            <div class="movie-info">
                <h2>${movie.title}</h2>
                <div class="movie-meta">
                    <span><i class="fas fa-star"></i> ${movie.rating}</span>
                    <span><i class="fas fa-clock"></i> ${movie.duration} min</span>
                    <span><i class="fas fa-calendar"></i> ${movie.releaseDate}</span>
                </div>
                <p class="movie-description">${movie.description}</p>
                <div class="movie-cast">
                    <h3>Cast</h3>
                    <div class="cast-list">
                        ${movie.cast.map(actor => `
                            <div class="cast-member">
                                <img src="${actor.photo}" alt="${actor.name}">
                                <span>${actor.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="showtimes">
                    <h3>Showtimes</h3>
                    <div class="showtime-list">
                        ${movie.showtimes.map(time => `
                            <button class="time-btn" onclick="selectShowtime('${time}')">${time}</button>
                        `).join('')}
                    </div>
                </div>
                <button class="book-btn" onclick="startBooking(${movie.id})">
                    Book Tickets
                </button>
            </div>
        `;

        modal.style.display = 'block';
    } catch (error) {
        showNotification('Error loading movie details', 'error');
    }
}

// Close movie details modal
function closeMovieModal() {
    document.getElementById('movieModal').style.display = 'none';
}

// Play movie trailer
function playTrailer(trailerId, event) {
    event.stopPropagation(); // Prevent opening movie details
    
    const modal = document.getElementById('trailerModal');
    const player = document.getElementById('trailerPlayer');
    
    player.innerHTML = `
        <iframe
            src="https://www.youtube.com/embed/${trailerId}?autoplay=1"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
        ></iframe>
    `;
    
    modal.style.display = 'block';
}

// Close trailer modal
function closeTrailerModal() {
    const modal = document.getElementById('trailerModal');
    const player = document.getElementById('trailerPlayer');
    
    player.innerHTML = '';
    modal.style.display = 'none';
}

// Search and filter movies
function performSearch() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const genre = document.getElementById('genreFilter').value;
    const date = document.getElementById('dateFilter').value;

    const filteredMovies = currentMovies.filter(movie => {
        const matchesSearch = movie.title.toLowerCase().includes(searchQuery) ||
                            movie.description.toLowerCase().includes(searchQuery);
        const matchesGenre = genre === 'all' || movie.genre.toLowerCase() === genre;
        // Add more filter conditions as needed
        
        return matchesSearch && matchesGenre;
    });

    displayMovies(filteredMovies);
}

// Event listeners for search and filter
document.getElementById('searchInput')?.addEventListener('input', performSearch);
document.getElementById('categoryFilter')?.addEventListener('change', performSearch);
document.getElementById('genreFilter')?.addEventListener('change', performSearch);
document.getElementById('dateFilter')?.addEventListener('change', performSearch);

// Export necessary functions
export {
    loadMovies,
    showMovieDetails,
    playTrailer,
    performSearch
};