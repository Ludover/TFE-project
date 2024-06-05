const mongoose = require("mongoose");

const movieSchema = mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
});

module.exports = mongoose.model("Movie", movieSchema);
