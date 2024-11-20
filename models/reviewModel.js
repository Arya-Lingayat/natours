const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },
    rating: {
      type: Number,
      min: [1, 'A rating must be above 1'],
      max: [5, 'A rating must be below 5'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a document'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//Creating compound index so that we have an unique tour-user combination to prevent duplicate review
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});
//Statics --> Model methods ,, Methods --> document methods
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

//Post middlewear does not get access to next
//DOCUMENT middlewear
reviewSchema.post('save', function () {
  //this points to current review
  //constructor model
  this.constructor.calcAverageRatings(this.tour);
});

//QUERY Middlewear
reviewSchema.pre(/^findOneAnd/, async function (next) {
  //We cannot call calcAverageRatings as document DNE in databse now,
  //That's why we pass the query to post middlewear
  this.r = await this.model.findOne(this.getQuery());
  console.log(this.r.constructor);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  //await this.findOne() DNE here
  //clalcAverageRatings cannot be called on this.r as it belongs to the entire model
  await this.r.constructor.calcAverageRatings(this.r.tour);
});
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
