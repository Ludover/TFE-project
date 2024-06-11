const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const moviesRoutes = require("./routes/movies");
const userRoutes = require("./routes/user");

const app = express();

mongoose
  .connect(
    "mongodb+srv://ludoverhenne:CsBEF7m89D44ieGe@cluster0.x6yp1c7.mongodb.net/?w=majority"
  )
  .then(() => {
    console.log("Connected to database");
  })
  .catch(() => {
    console.log("Connection failed");
  });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-headers",
    "Origin, X-Requested-With, Content-type, Accept"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  next();
});

app.use("/api/movies", moviesRoutes);
app.use("/api/user", userRoutes);

module.exports = app;
