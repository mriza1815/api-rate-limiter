const express = require("express");
const apiRateLimiter = require("./apiRateLimiter");
const indexRoute = require("./router");

const app = express();
const port = 3000;

//MIDDLEWARES
app.use(apiRateLimiter);

// URLS
app.use("/other-worlds", indexRoute);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
