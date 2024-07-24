require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const connectMongo = require("./config/connectMongo");

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ strict: true }));
app.enable("trust proxy");
app.disable("x-powered-by");
connectMongo();

app.use("/login", require("./routes/login"));
app.use("/logout", require("./routes/logout"));
app.use("/register", require("./routes/register"));
app.use("/refresh", require("./routes/refresh"));
app.use("/api/generate", require("./routes/api/generate"));

app.use("/", function (req, res) {
  res.json({ error: "endpoint not found" });
});

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
});
