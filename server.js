const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log(`UNCAUGHT EXCEPTION 🔥 Shutting down.....`);
  console.log(err.name, err.message);
  const stackLines = err.stack.split('\n');
  console.log(stackLines[1]);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.MONGODB_APPLICATION_CONNECTION_STRING.replace(
  '<DATABASE_PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    // useNewUrlParser: true,
  })
  .then((con) => {
    console.log(`DB Connection Successful`);
  });

// console.log(process.env);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port : ${port}`);
});

//TEST
//unhandled rejection" occurs when a Promise is rejected
// but no catch handler or then with an error handler is attached to handle the error.
process.on('unhandledRejection', (err) => {
  console.log(`UNHANDLED REJECTION 🔥 Shutting down....`);
  // console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
