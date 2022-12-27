export default {
  port: 3000,
  dbUri: process.env.DATABASE_URL, //user-api-tutorial", // todo /uni_housing_backend
  logLevel: "info",
  accessTokenPrivateKey: "",
  refreshTokenPrivateKey: "",
  smtp: {
    // development - test mode
    user: "qkpd6sw3bx7v6qcx@ethereal.email",
    pass: "h3JdguzwQNgFRwFsxr",
    // user: process.env.OWNER_EMAIL,
    // pass: process.env.OWNER_EMAIL_PASSWORD,

    host: "smtp.ethereal.email", // test mode
    port: 587,
    secure: false, // fase in dev mode

    // otherwise self signed certificate in certificate chain error when sending email in mailer.ts
    tls: {
      rejectUnauthorized: false 
    }
  }, // todo, in production we want secure to be set to true and use different credentials
};
