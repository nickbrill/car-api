require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

const AIRTABLE_API_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/cars`; // Replace 'Cars' with your table name
const AIRTABLE_HEADERS = {
  Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
};

app.get('/cars', async (req, res) => {
    try {
      console.log("🔑 API KEY:", process.env.AIRTABLE_API_KEY);
      console.log("📦 BASE ID:", process.env.AIRTABLE_BASE_ID);
  
      const response = await axios.get(AIRTABLE_API_URL, {
        headers: AIRTABLE_HEADERS
      });
      const cars = response.data.records.map(record => record.fields);
      res.json(cars);
    } catch (error) {
      console.error("Airtable Error:", error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to fetch car data' });
    }
  });

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
