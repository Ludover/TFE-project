const mongoose = require("mongoose");

const movieSchema = mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  list: { type: String, required: true },
  creator: {type: mongoose.Schema.ObjectId, ref:"User", required: true }
});

module.exports = mongoose.model("Movie", movieSchema);
