const fetch = require('node-fetch'); // Use local fetch if node < 18

(async () => {
    try {
        const loginRes = await fetch('http://localhost:3000/api/v1/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@cinebook.com', password: 'admin123' })
        });
        const loginData = await loginRes.json();

        // Find a showtime first
        const stRes = await fetch('http://localhost:3000/api/v1/showtimes');
        const stData = await stRes.json();
        const firstST = stData.data[0]._id;

        const res = await fetch('http://localhost:3000/api/v1/reservations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginData.token}`
            },
            body: JSON.stringify({
                showtimeId: firstST,
                seats: ["A5"]
            })
        });
        const data = await res.json();
        console.log("Booking Response:", data);
    } catch (e) {
        console.error(e);
    }
})();
