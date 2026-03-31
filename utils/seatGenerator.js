// utils/seatGenerator.js

const generateSeats = (total_rows, total_cols) => {
    const seats = [];

    for (let r = 0; r < total_rows; r++) {
        const row_label = String.fromCharCode(65 + r); // A, B, C ...

        for (let c = 1; c <= total_cols; c++) {
            seats.push({
                seat_number: `${row_label}${c}`,       // "A1", "A2"
                row_label,
                col_number: c,
                type: 'regular',
                price: 150,                             // default price
            });
        }
    }

    return seats;
};

module.exports = generateSeats;