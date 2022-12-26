// to require a dotenv file
require("dotenv").config();

import express from "express";
import config from "config";

// to connect to the database
import connectToDb from "./utils/connectToDb";

// logging information 
import log from "./utils/logger";

// routing
import router from "./routes";

import deserializeUser from "./middleware/deserializeUser";

// initializing
const app = express();

// in express we need a middleware to parse the body - must be called before app.use(router) !!!
app.use(express.json());

// checking the access token
app.use(deserializeUser);

app.use(router);

// creating a port so client can connect -> port is in config/default.ts
const port = config.get("port");

app.listen(port, () => {
  log.info(`App started at http://localhost:${port}`);

  // connection to our database
  connectToDb();
});
