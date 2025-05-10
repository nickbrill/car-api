require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const port = process.env.PORT || 3000;

const AIRTABLE_API_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/cars`; // Replace 'Cars' with your table name
const AIRTABLE_HEADERS = {
  Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
};

app.get('/cars', async (req, res) => {
    try {
        console.log("🔑 API KEY:", process.env.AIRTABLE_API_KEY);
        console.log("📦 BASE ID:", process.env.AIRTABLE_BASE_ID);

        // Fetch data from Airtable
        const response = await axios.get(AIRTABLE_API_URL, {
            headers: AIRTABLE_HEADERS
        });
        const cars = response.data.records.map(record => record.fields);

        // Extract query parameters
        const { make, model, yearFrom, yearTo, transmission, auctionDate } = req.query;

        // Filter cars based on query parameters
        let filteredCars = cars;

        if (make) {
            filteredCars = filteredCars.filter(car => car.Make?.toLowerCase() === make.toLowerCase());
        }
        if (model) {
            filteredCars = filteredCars.filter(car => car.Model?.toLowerCase() === model.toLowerCase());
        }
        if (yearFrom) {
            filteredCars = filteredCars.filter(car => parseInt(car.Year) >= parseInt(yearFrom));
        }
        if (yearTo) {
            filteredCars = filteredCars.filter(car => parseInt(car.Year) <= parseInt(yearTo));
        }
        if (transmission) {
            filteredCars = filteredCars.filter(car => car.Transmission?.toLowerCase() === transmission.toLowerCase());
        }
        if (auctionDate) {
            const today = new Date().toISOString().split('T')[0];
            if (auctionDate === 'today') {
                filteredCars = filteredCars.filter(car => car['Auction Date'] === today);
            } else if (auctionDate === 'future') {
                filteredCars = filteredCars.filter(car => car['Auction Date'] > today);
            } else if (auctionDate === 'past') {
                filteredCars = filteredCars.filter(car => car['Auction Date'] < today);
            }
        }

        // Return filtered cars
        res.json(filteredCars);
    } catch (error) {
        console.error("Airtable Error:", error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch car data' });
    }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
