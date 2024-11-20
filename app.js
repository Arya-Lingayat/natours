const fs = require('fs');

//Express configuration
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const AppError = require('./Utils/AppErrors');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

//Creating an object
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
//////////////////////////////////////////
//Global  Middlewear

//Serving static files
app.use(express.static(path.join(__dirname, 'public')));

//use() method uses middlewear , adds middlewear to middlewear stack
//Morgan is a popular middlewear used for logging
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// //Set Security HTTP headers
// app.use(helmet());

//Prevents same IP from making too many requests
//Prevents brute-force attacks and denial-of-service.
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});

//affects all routes with /api
app.use('/api', limiter);

//Body parser,reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' })); //Parses data coming from form
app.use(cookieParser());

//Data sanitization -> Cleaning malicious code
//data sanitization against NoSQL query injection
app.use(mongoSanitize()); // filters any "$" symbols in body

//Data sanitization against XSS attack
app.use(xss()); //removes malicious HTML code

//Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
      'ratingsAverage',
    ],
  }),
);

//Test middlewear
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

//Using parameters;
// app.get('/api/v1/tours/:id', getTour);
// app.patch('/api/v1/tours/:id',  updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// Routes

//Mounting the routers
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server`,
  // });

  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
