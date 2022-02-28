# going-through-it-be
Back-end for Going Through It app

To authenticate to the Google Maps/Places API, you'll need your own API key.
To run locally, create a .env based on .env.sample and put in your own key. Uncomment require('dotenv').config() in index.js.
To run on Heroku, set your API key as a config var and keep require('dotenv').config() in index.js commented out. You will not need the .env to run on Heroku.