const catchAsync = require('./../Utils/catchAsync');
const AppError = require('./../Utils/AppErrors');
const APIFeatures = require('./../Utils/APIFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No  document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, //new updated document is returned
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No  document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    //populate fills the guide with actual query , only for reviews in tour
    ////It only reflects in query response and not in database
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    //Tour.findOne({_id : req.params.id})

    //if tour Id does not exists passes an error to global error handler
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    //Callback is also called as route-handler
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });

    // console.log(req.params);
    // const id = +req.params.id;
    // const tour = tours.find((el) => el.id === id);

    //   if (id > tours.length)
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //To allow fpr nested getReviews on Tours
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // const docs = await features.query.explain();
    const docs = await features.query;
    //query.sort().select().skip().limit()

    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: docs.length,
      data: {
        data: docs,
      },
    });
  });
