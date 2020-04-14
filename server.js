'use strict';

const express = require('express');
const mongoose = require('mongoose');

const { DATABASE_URL, PORT} = require('./config');

const app = express();

mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);

let server;

// this function connects to our database, then starts the server
function runServer(databaseUrl, port) {
  return new Promise((resolve, reject) => {
    mongoose.connect(
      databaseUrl,
      (err) => {
        if (err) {
          return reject(err);
        }
        server = app
          .listen(port, () => {
            console.log(`Your app is running on port ${port}...\nyou better go and catch it.`);
            resolve();
          })
          .on("error", err => {
            mongoose.disconnect();
            reject(err);
          });
      }
    );
  });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log("Closing server");
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

// will run if `server.js` is run directly via yarn start
// will not run for unit tests
if (require.main === module) {
  runServer(DATABASE_URL, PORT).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
