const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const userRoutes = require("./routes/user");
require("dotenv").config();
const { eventsHandler } = require("./middleware/sse-manager");

const app = express();

// Connection à MongoDB
mongoose
  .connect(
    "mongodb+srv://ludoverhenne:" +
      process.env.MONGO_ATLAS_PW +
      "@cluster0.x6yp1c7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => {
    console.log("Connected to database");
  })
  .catch(() => {
    console.log("Connection failed");
  });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Headers pour le CORS
app.use((req, res, next) => {
  const allowedOrigins = ["http://localhost:4200", "http://www.monpopcorn.com"]; // Remplacez par vos origines autorisées
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-headers",
    "Origin, X-Requested-With, Content-type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  next();
});

app.options("/*", (req, res) => {
  const allowedOrigins = ["http://localhost:4200", "http://www.monpopcorn.com"]; // Remplacez par vos origines autorisées
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.status(200).end();
});

app.use("/api/user", userRoutes);

// Configuration SSE
app.get("/sse", eventsHandler);

module.exports = app;
