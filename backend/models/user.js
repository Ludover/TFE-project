const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const movieSchema = mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  list: { type: String, required: true }, // "a voir" ou "vu"
  creator: { type: String },
  imdbId: { type: String, required: true },
});

const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  pseudo: { type: String, required: true, unique: true },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  friendRequestsReceived: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  ],
  movies: [movieSchema],
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
