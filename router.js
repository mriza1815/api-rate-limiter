const { json } = require("express");
const express = require("express");
const router = express.Router();
const otherWorlds = [
  {
    id: 1,
    author: "Victor Hugo",
    title: "Les Misarables",
    body: "Jan Valjan and crime",
  },

  {
    id: 2,
    author: "James Joyce",
    title: "Ulyssess",
    body: "Hardest book in history",
  },

  {
    id: 3,
    author: "Patrick Rothfuss",
    title: "Kingkiller Chronicles",
    body: "Name of the wind and so on",
  },

  {
    id: 4,
    author: "Franz Kafka",
    title: "The Castle",
    body: "K.",
  },
];
router.get("/", function (req, res, next) {
  res.json(otherWorlds);
});

module.exports = router;
