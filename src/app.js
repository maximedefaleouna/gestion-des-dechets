const express = require("express");
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Projet Goupe 2");
});

module.exports = app;
