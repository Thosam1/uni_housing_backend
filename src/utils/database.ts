import mongoose from "mongoose";
import config from "config";
import log from "./logger";

// allows to connect to database : dbUri is in config/default.ts
export async function connectToDb() {
  const dbUri = config.get<string>("dbUri"); // type unkown so -> generic

  try {
    await mongoose.connect(dbUri);
    mongoose.connection
    log.info("Connected to DB");
  } catch (e) {
    // exiting with a failure

    log.info("Failed to connect to DB");
    process.exit(1);
  }
}

export async function disconnectFromDatabase() {
  await mongoose.connection.close();

  log.info("Disconnect from database");

  return;
}
