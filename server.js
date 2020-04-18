'use strict';

const express = require('express');
const mongoose = require('mongoose');

const {DATABASE_URL, PORT} = require('./config');

const {Blogpost} = require("./models");

const app = express();
app.use(express.json());

mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useFindAndModify', false);

// retrieve all the blogposts
app.get('/blogposts', (req, res) => {
  Blogpost.find({}).then(blogposts => res.json({blogposts}))
    .catch((error) => {
      console.error(error);
      res.status(500).json({message: "Internal server error"});
    });
});

// retrieve one blogpost by id
app.get('/blogposts/:id', (req, res) => {
  Blogpost.findById(req.params.id).then(blogpost => res.json({blogpost}))
    .catch((error) => {
      console.error(error);
      res.status(500).json({message: "Internal server error"});
    });
});

// add a blogpost
app.post('/blogposts', (req, res) => {
  const requiredFields = ['title', 'content', 'author'];
  const getMissingFieldMessage = (field) => `Missing field: '${field}' in request body.`;

  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!req.body[field]) {
      console.error(getMissingFieldMessage(field));
      return res.status(400).send(getMissingFieldMessage(field));
    }
  }

  Blogpost.create({
    title: req.body.title,
    content: req.body.content,
    author: req.body.author
  }).then((blogpost) => res.status(201).json({blogpost}))
    .catch((error) => {
      console.error(error);
      res.status(500).json({message: "Internal Server Error"});
    });
});

// update one blogpost by id
app.put('/blogposts/:id', (req, res) => {
// TODO: check that id from req.body matches req.params otherwise log/send error

// TODO: check for valid fields to update. Only append valid fiends to toUpdate object

const toUpdate = req.body;

  Blogpost.findByIdAndUpdate(req.params.id, {$set: toUpdate})
    .then(() => res.status(204))
    .catch((error) => {
      console.error(error);
      res.status(500).json({message: "Internal server error"});
    });
});

// delete one blogpost by id
app.delete('/blogposts/:id', (req, res) => {
  Blogpost.findByIdAndRemove(req.params.id)
    .then(() => res.status(204).end())
    .catch((error) => {
      console.error(error);
      res.status(500).json({message: "Internal server error"});
    })
});

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
