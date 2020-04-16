'use strict';

const mongoose = require('mongoose');

const blogpostSchema = mongoose.Schema({
  title: {type: String, required: true},
  content: {type: String, required: true},
  author: {
    firstName: {type: String, required: true},
    lastName: {type: String, required: true}
  }
});

const Blogpost = mongoose.model("Blogpost", blogpostSchema);

module.exports = {Blogpost};