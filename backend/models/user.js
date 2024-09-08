const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const friendSchema = mongoose.Schema({
  friendId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  dateAdded: { type: Date, default: new Date() },
});

const movieSchema = mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  dateSeen: { type: String },
  list: { type: String, required: true },
  creator: { type: String },
  friendComment: { type: String },
  tmdbId: { type: String, required: true },
});

const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  pseudo: { type: String, required: true, unique: true },
  friends: [friendSchema],
  friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  friendRequestsReceived: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  ],
  movies: [movieSchema],
  resetToken: { type: String },
  resetTokenExpiration: { type: Date },
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
