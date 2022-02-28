// Allows loading conf from .env - for local runs
// require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3001; // 3001 for local runs
const cors = require('cors');
const cache = require('memory-cache');
const { body } = require('express-validator');
const { Client } = require('@googlemaps/google-maps-services-js');

app.use(express.json());
app.use(cors({origin: 'https://going-through-it.netlify.app'}));

// GMaps client
const client = new Client({});

const placeDetailsSearch = (placeId) =>
  new Promise((resolve, reject) =>
    client
      .placeDetails({
        params: {
          fields: [
            'name',
            'formatted_address',
            'formatted_phone_number',
            'website',
          ],
          key: process.env.GOOGLE_MAPS_API_KEY,
          place_id: placeId,
        },
        timeout: 2000, // milliseconds
      })
      .then((r) =>
        resolve(r.data)
      )
      .catch((e) =>
        reject(console.error(e))
      )
    );

const placeTextSearch = (res, place) =>
  client
    .textSearch({
      params: {
      // Set default location to Wellington
        locations: [{
          lat: -41.228241,
          lng: 174.90512,
        }],
        query: `mental health in ${place}`,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
      timeout: 2000, // milliseconds
    })
    .then((r) => {
      const response = r.data;
      if (response.status === 'OK') {
        const results = response.results;
        const placeDetailsSearchCalls = results.map((result, i) =>
          placeDetailsSearch(results[i].place_id));
        Promise.all([...placeDetailsSearchCalls])
          .then((placeDetails) => {
            // cache expires in 12 hrs
            cache.put(place, placeDetails, 43200000);
            res.json(placeDetails);
          })
          .catch((e) => {
            console.error(e);
            // Keeping error response vague for security reasons
            res.send(e);
          });
      }
    })
    .catch((e) => {
      console.error(e);
      // Keeping error response vague for security reasons
      res.send(e);
    });

app.post('/places', 
body('place').trim().escape().toLowerCase(), (req, res) => {
  const place = req.body.place;
  if (place === '') res.send([]);
  cache.get(place) != null ? 
    res.send(cache.get(place)) :
    placeTextSearch(res, place);
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
