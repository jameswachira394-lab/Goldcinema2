// Booking system management
let currentBooking = {
    movieId: null,
    showtime: null,
    seats: [],
    totalAmount: 0
};

// Constants
const TICKET_PRICE = 12;
const MAX_SEATS = 10;

// Start booking process
function startBooking(movieId) {
    if (!currentUser) {
        showNotification('Please sign in to book tickets', 'warning');
        showLoginModal();
        return;
    }

    currentBooking.movieId = movieId;
    showBookingModal();
}

// Show booking modal
function showBookingModal() {
    const modal = document.getElementById('bookingModal');
    const container = modal.querySelector('.booking-container');

    container.innerHTML = `
        <h2>Book Tickets</h2>
        <div class="booking-steps">
            <div class="step active" data-step="1">1. Select Seats</div>
            <div class="step" data-step="2">2. Select Add-ons</div>
            <div class="step" data-step="3">3. Payment</div>
        </div>
        <div class="step-content">
            ${generateSeatsLayout()}
        </div>
        <div class="booking-summary">
            <div class="summary-content">
                <h3>Booking Summary</h3>
                <p>Selected Seats: <span id="selectedSeats">None</span></p>
                <p>Total Amount: $<span id="totalAmount">0</span></p>
            </div>
            <div class="booking-actions">
                <button class="back-btn" onclick="previousStep()" style="display: none;">Back</button>
                <button class="next-btn" onclick="nextStep()">Next</button>
            </div>
        </div>
    `;

    modal.style.display = 'block';
}

// Generate seats layout
function generateSeatsLayout() {
    let layout = '<div class="screen">Screen</div><div class="seats-container">';
    
    // Generate 8 rows of 10 seats
    for (let row = 0; row < 8; row++) {
        layout += '<div class="seat-row">';
        for (let seat = 0; seat < 10; seat++) {
            const seatId = `${String.fromCharCode(65 + row)}${seat + 1}`;
            layout += `
                <div class="seat" data-seat="${seatId}" onclick="toggleSeat('${seatId}')">
                    <span class="seat-number">${seatId}</span>
                </div>
            `;
        }
        layout += '</div>';
    }
    
    layout += '</div>';
    return layout;
}

// Toggle seat selection
function toggleSeat(seatId) {
    const seat = document.querySelector(`[data-seat="${seatId}"]`);
    
    if (seat.classList.contains('booked')) {
        return; // Seat is already booked
    }

    if (seat.classList.contains('selected')) {
        seat.classList.remove('selected');
        currentBooking.seats = currentBooking.seats.filter(s => s !== seatId);
    } else {
        if (currentBooking.seats.length >= MAX_SEATS) {
            showNotification(`Maximum ${MAX_SEATS} seats allowed per booking`, 'warning');
            return;
        }
        seat.classList.add('selected');
        currentBooking.seats.push(seatId);
    }

    updateBookingSummary();
}

// Update booking summary
function updateBookingSummary() {
    const selectedSeatsElement = document.getElementById('selectedSeats');
    const totalAmountElement = document.getElementById('totalAmount');

    if (currentBooking.seats.length > 0) {
        selectedSeatsElement.textContent = currentBooking.seats.join(', ');
        currentBooking.totalAmount = currentBooking.seats.length * TICKET_PRICE;
    } else {
        selectedSeatsElement.textContent = 'None';
        currentBooking.totalAmount = 0;
    }

    totalAmountElement.textContent = currentBooking.totalAmount;
}

// Handle booking steps
let currentStep = 1;

function nextStep() {
    if (currentStep === 1 && currentBooking.seats.length === 0) {
        showNotification('Please select at least one seat', 'warning');
        return;
    }

    if (currentStep < 3) {
        currentStep++;
        updateBookingStep();
    } else {
        confirmBooking();
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateBookingStep();
    }
}

function updateBookingStep() {
    const steps = document.querySelectorAll('.step');
    const backBtn = document.querySelector('.back-btn');
    const nextBtn = document.querySelector('.next-btn');
    const stepContent = document.querySelector('.step-content');

    // Update step indicators
    steps.forEach(step => {
        const stepNumber = parseInt(step.dataset.step);
        step.classList.toggle('active', stepNumber <= currentStep);
    });

    // Show/hide back button
    backBtn.style.display = currentStep > 1 ? 'block' : 'none';

    // Update next button text
    nextBtn.textContent = currentStep === 3 ? 'Confirm Booking' : 'Next';

    // Update step content
    switch (currentStep) {
        case 1:
            stepContent.innerHTML = generateSeatsLayout();
            // Restore selected seats
            currentBooking.seats.forEach(seatId => {
                const seat = document.querySelector(`[data-seat="${seatId}"]`);
                if (seat) seat.classList.add('selected');
            });
            break;
        case 2:
            stepContent.innerHTML = generateAddOnsContent();
            break;
        case 3:
            stepContent.innerHTML = generatePaymentContent();
            break;
    }
}

// Generate add-ons content
function generateAddOnsContent() {
    return `
        <div class="add-ons-section">
            <h3>Food & Beverages</h3>
            <div class="add-ons-grid">
                <div class="add-on-item">
                    <img src="assets/images/popcorn.jpg" alt="Popcorn">
                    <div class="add-on-info">
                        <h4>Popcorn</h4>
                        <p>$5.00</p>
                        <div class="quantity-control">
                            <button onclick="updateQuantity('popcorn', -1)">-</button>
                            <span id="popcorn-quantity">0</span>
                            <button onclick="updateQuantity('popcorn', 1)">+</button>
                        </div>
                    </div>
                </div>
                <!-- Add more items -->
            </div>
        </div>
    `;
}

// Generate payment content
function generatePaymentContent() {
    return `
        <div class="payment-section">
            <h3>Payment Details</h3>
            <form id="paymentForm" onsubmit="processPayment(event)">
                <div class="form-group">
                    <label>Card Number</label>
                    <input type="text" placeholder="1234 5678 9012 3456" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Expiry Date</label>
                        <input type="text" placeholder="MM/YY" required>
                    </div>
                    <div class="form-group">
                        <label>CVV</label>
                        <input type="text" placeholder="123" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Name on Card</label>
                    <input type="text" placeholder="John Doe" required>
                </div>
            </form>
        </div>
    `;
}

// Process payment and confirm booking
async function confirmBooking() {
    try {
        const response = await api.createBooking(currentBooking);
        if (response.success) {
            showNotification('Booking confirmed successfully!', 'success');
            closeBookingModal();
            // Send confirmation email
            sendBookingConfirmation(response.bookingId);
        }
    } catch (error) {
        showNotification('Booking failed. Please try again.', 'error');
    }
}

// Send booking confirmation email
async function sendBookingConfirmation(bookingId) {
    try {
        await api.sendBookingConfirmation(bookingId);
    } catch (error) {
        console.error('Error sending confirmation email:', error);
    }
}

// Close booking modal
function closeBookingModal() {
    document.getElementById('bookingModal').style.display = 'none';
    currentBooking = {
        movieId: null,
        showtime: null,
        seats: [],
        totalAmount: 0
    };
    currentStep = 1;
}

// Export necessary functions
export {
    startBooking,
    showBookingModal,
    closeBookingModal,
    toggleSeat,
    nextStep,
    previousStep
};