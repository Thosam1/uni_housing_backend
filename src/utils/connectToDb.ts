import mongoose from "mongoose";
import config from "config";
import log from "./logger";

// allows to connect to database : dbUri is in config/default.ts
async function connectToDb() {
  const dbUri = config.get<string>("dbUri"); // type unkown so -> generic

  try {
    await mongoose.connect(dbUri);
    log.info("Connected to DB");
  } catch (e) {
    // exiting with a failure
    process.exit(1);
  }
}

export default connectToDb;
