// to require a dotenv file
require("dotenv").config();

import express from "express";
import config from "config";

import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

// to connect to the database
import { connectToDb, disconnectFromDatabase } from "./utils/database";

// logging information
import log from "./utils/logger";

// routing
import router from "./routes";

import deserializeUser from "./middleware/deserializeUser";
import { CORS_ORIGIN } from "./constants";

// initializing
const app = express();

// to parse cookies
app.use(cookieParser());

// in express we need a middleware to parse the body - must be called before app.use(router) !!!
app.use(express.json());

// to make the API public
app.use(
  cors({
    origin: CORS_ORIGIN, // with '*', the register request from client works
    credentials: true,
    // origin: '*', // CORS_ORIGIN, // '*' // 'http://localhost:19006/' //
    // credentials: true,
  })
);

// to make the app more secure (eg: hiding headers, ...)
app.use(helmet());

// checking the access token
app.use(deserializeUser);


// after all middlewares

app.use(router);

// creating a port so client can connect -> port is in config/default.ts
const port = config.get("port");
const hostname = "172.23.208.1";

const server = app.listen(port, () => {
  log.info(`App started at http://localhost:${port}`);
  log.info(`App started at http://${hostname}:${port}`);

  // connection to our database
  connectToDb();
});

const signals = ["SIGTERM", "SIGINT"];

function gracefulShutdown(signal: string) {
  process.on(signal, async () => {
    log.info("Goodbye, got signal", signal);
    server.close();

    // disconnect from the db
    await disconnectFromDatabase();

    log.info("My work here is done");

    process.exit(0);
  });
}

for (let i = 0; i < signals.length; i++) {
  gracefulShutdown(signals[i]);
}
