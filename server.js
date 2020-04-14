'use strict';

const express = require('express');
const mongoose = require('mongoose');

const { DATABASE_URL, PORT} = require('./config');

const app = express();

mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);

let server;

// retrieve all the blogposts
app.get('/blogposts', (req, res) => {
  res.send('all the blogposts');
});

// retrieve one blogpost by id
app.get('/blogposts/:id', (req, res) => {
  res.send(`one blogpost with id: ${req.params.id}`);
});

// add a blogpost
app.post('/blogposts', (req, res) => {
  res.send('added a blogpost');
});

// update one blogpost by id
app.put('/blogposts/:id', (req, res) => {
  res.send(`update one blogpost with id: ${req.params.id}`);
});

// delete one blogpost by id
app.delete('/blogposts/:id', (req, res) => {
  res.send(`delete one blogpost with id: ${req.params.id}`);
});

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
