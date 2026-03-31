(async () => {
    try {
        const loginRes = await fetch('http://127.0.0.1:3000/api/v1/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@cinebook.com', password: 'admin123' })
        });
        const loginData = await loginRes.json();

        const stRes = await fetch('http://127.0.0.1:3000/api/v1/showtimes');
        const stData = await stRes.json();
        const activeST = stData.data.find(s => s.status === 'scheduled');

        const bookRes = await fetch('http://127.0.0.1:3000/api/v1/create-razorpay-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${loginData.token}` },
            body: JSON.stringify({ showtimeId: activeST._id, seats: ['A3'] })
        });
        const bookText = await bookRes.text();
        console.log("Razorpay Response TEXT:", bookText);
    } catch (e) {
        console.error("Script Error:", e);
    }
})();
