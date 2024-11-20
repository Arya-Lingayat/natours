const User = require('./../models/userModel');
const multer = require('multer');
const sharp = require('sharp');
const catchAsync = require('./../Utils/catchAsync');
const AppError = require('./../Utils/AppErrors');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user-id-Timestamp-jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else
    cb(new AppError('Not an image!Please upload only images.', 400), false);
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
}); // images stored in the destination

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  //Creates object that can be used for image processing
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`); //Stores on disk

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTS password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates.Please use /updateMyPassword.',
        400,
      ),
    );
  }
  // 2 Filtered out unwanted users
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update user document
  //findByIdAndUpdate should only be used for changing insensitive info abt the user
  // i.e. anything but the password
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  // We do not actually delete the user from database but make the user 'inactive'

  //findByIdAndUpdate should only be used for changing insensitive info abt the user
  // i.e. anything but the password
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (res, req) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined! Please use SignUp instead',
  });
};

//Adminstrator can delete any user without keeping the active field false
//Do not update sensitive info
exports.deleteUser = factory.deleteOne(User);
exports.updateUser = factory.updateOne(User);
exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
