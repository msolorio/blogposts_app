'use strict';

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const {DATABASE_URL, PORT} = process.env;

const {Blogpost, Author} = require("./models");

const app = express();
app.use(express.json());

mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useFindAndModify', false);

// retrieve all the blogposts
app.get('/blogposts', (req, res) => {
  Blogpost.find({})
    .populate('author')
    .then(blogposts => {
      res.json({
        blogposts: blogposts.map(post => post.serialize())
      })
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({message: "Internal server error attempting GET to /blogposts"});
    });
});

// retrieve one blogpost by id
app.get('/blogposts/:id', (req, res) => {
  Blogpost.findById(req.params.id)
    .populate('author')
    .then(blogpost => res.json({blogpost: blogpost.serialize()}))
    .catch((error) => {
      console.error(error);
      res.status(500).json({message: "Internal server error attempting GET to /blogposts/:id"});
    });
});

// add a blogpost
app.post('/blogposts', (req, res) => {
  const requiredFields = ['title', 'content', 'author_id'];
  const getMissingFieldMessage = (field) => `Missing field: '${field}' in request body.`;

  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!req.body[field]) {
      console.error(getMissingFieldMessage(field));
      return res.status(400).send(getMissingFieldMessage(field));
    }
  }

  Author.findById(req.body.author_id)

    // if author exists create a blogpost
    .then(author => {
      Blogpost.create({
        title: req.body.title,
        content: req.body.content,
        author: mongoose.Types.ObjectId(req.body.author_id)
      })
      .then((blogpost) => res.status(201).end())
      .catch((error) => {
        console.error(error);
        res.status(500).json({message: "Internal server error attempting POST to /blogposts"});
      });

    })

    // if author does not exist send error message
    .catch(error => {
      const message = "author_id in request body is invalid.";
      console.error(message);
      return res.status(400).send({message});
    });
});

// update one blogpost by id
app.put('/blogposts/:id', (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = "Request path id must match request body id";
    console.error(message);
    return res.status(400).json({message});
  }

  const validUpdateFields = ["title", "content"];
  const toUpdate = {};

  for (let i=0; i<validUpdateFields.length; i++) {
    const field = req.body[validUpdateFields[i]];
    if (field) {
      toUpdate[validUpdateFields[i]] = field;
    }
  }

  Blogpost.findByIdAndUpdate(req.params.id, {$set: toUpdate})
    .then((blogpost) => res.status(204).end())
    .catch((error) => {
      console.error(error);
      res.status(500).json({message: "Internal server error attempting PUT to /blogposts/:id"});
    });
});

// delete one blogpost by id
app.delete('/blogposts/:id', (req, res) => {
  Blogpost.findByIdAndRemove(req.params.id)
    .then(() => res.status(204).end())
    .catch((error) => {
      console.error(error);
      res.status(500).json({message: "Internal server error attempting DELETE to /blogposts/:id"});
    })
});

// POST /authors - create author
app.post('/authors', (req, res) => {
  const requiredFields = ['firstName', 'lastName', 'userName'];
  const getMissingFieldMessage = (field) => `Missing field: '${field}' in request body.`;

  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!req.body[field]) {
      console.error(getMissingFieldMessage(field));
      return res.status(400).send(getMissingFieldMessage(field));
    }
  }

  Author.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    userName: req.body.userName
  })
  .then(() => res.status(201).end())
  .catch(error => {
    console.error(error);
    res.status(500).json({message: "Internal server error attempting POST to /authors"});
  });
});

// PUT /authors/:id - update authors firstName, lastName, and userName
app.put('/authors/:id', (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = "Request path id must match request body id";
    console.error(message);
    return res.status(400).json({message});
  }

  const validUpdateFields = ["firstName", "lastName", "userName"];
  const toUpdate = {};

  for (let i=0; i<validUpdateFields.length; i++) {
    const field = req.body[validUpdateFields[i]];
    if (field) {
      toUpdate[validUpdateFields[i]] = field;
    }
  }

  Author.findByIdAndUpdate(req.params.id, {$set: toUpdate})
    .then(() => res.status(204).end())
    .catch((error) => {
      console.error(error);
      res.status(500).json({message: "Internal server error attempting PUT to /author/:id"});
    });
});

// DELETE /authors/:id - delete author by id
app.delete('/authors/:id', (req, res) => {

  // remove author by id
  Author.findByIdAndRemove(req.params.id)
    .then((author) => {

      // remove all blogposts associated with author
      Blogpost.deleteMany({author: mongoose.Types.ObjectId(author._id)})
        .then(() => {
          res.status(204).end();
        }).
        catch(error => {
          console.error(error);
          res.status(500).json({message: "Internal server error attempting to remove blogposts from deleted author"});
        });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({message: "Internal server error attempting DELETE to /author/:id"});
    });
});

let server;

// connect to database and start server
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
