/* Logger for our application */
import logger from "pino"; // logger library
import dayjs from "dayjs"; // to format date and time
import config from "config";

const level = config.get<string>("logLevel"); // config/default.ts

const log = logger({
  transport: {
    target: "pino-pretty",
  },
  level,
  base: {
    pid: false, // process id
  },
  timestamp: () => `,"time":"${dayjs().format()}"`,
});

export default log;
