const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Sample movie data
const movies = [
    { id: 1, title: "Inception", price: { regular: 1500, vip: 3000, vvip: 5000 } },
    { id: 2, title: "The Dark Knight", price: { regular: 1500, vip: 3000, vvip: 5000 } }
];

// Routes
app.get('/api/movies', (req, res) => {
    res.json(movies);
});

app.post('/api/register', (req, res) => {
    // Mock registration
    res.json({ message: 'Registration successful' });
});

app.post('/api/login', (req, res) => {
    // Mock login
    const token = 'mock-token-123';
    const user = { id: 1, username: req.body.usernameOrEmail };
    res.json({ token, user });
});

app.post('/api/bookings', (req, res) => {
    // Mock booking creation
    const bookingId = Math.floor(Math.random() * 1000);
    res.json({ bookingId });
});

app.post('/api/pay', (req, res) => {
    // Mock payment initiation
    res.json({ message: 'Payment initiated successfully' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});