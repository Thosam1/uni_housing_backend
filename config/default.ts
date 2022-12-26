export default {
  port: 3000,
  dbUri: process.env.DATABASE_URL, //user-api-tutorial", // todo /uni_housing_backend
  logLevel: "info",
  accessTokenPrivateKey: "",
  refreshTokenPrivateKey: "",
  smtp: {
    user: "kfdxpkwygc3u24yx@ethereal.email",
    pass: "efpmh52hKWBjjb4bDp",
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
  }, // todo, in production we want secure to be set to true and use different credentials
};
