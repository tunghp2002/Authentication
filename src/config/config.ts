export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  database: {
    connectionString: process.env.MONGO_URL,
  },
  mail: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
  },
});
