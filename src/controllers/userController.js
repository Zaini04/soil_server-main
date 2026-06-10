const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { sendSuccessResponse } = require('../utils/helpers');
const userFactory = require('./factories/userFactory');
const logger = require('../logger')('USER_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const User = require('../models/userModel');
const Inventory = require('../models/inventoryModel');
const Joi = require('joi');
const sendContactEmail = require('../utils/mails/sendContactEmail');
const { country, gender, dateOfBirth } = require('../validations/baseJoiSchemas');
const {
  PATCHJoiSchema,
  GETJoiSchema,
} = require('../validations/userValidations');

exports.adminLogin = userFactory.adminLogin();
exports.adminUserRegister = userFactory.adminRegisterUser();
exports.userLogin = userFactory.adminLogin();
exports.googleLogin = userFactory.googleLogin();
exports.appleLogin = userFactory.appleLogin();
exports.register = userFactory.registerUser();
exports.verifyOtp = userFactory.verifyOtp();
exports.resendOtp = userFactory.resendOtp();
exports.getProfile = userFactory.profile();
exports.updatePassword = userFactory.updatePassword();
exports.forgotPassword = userFactory.forgotPassword();
exports.resetPassword = userFactory.resetPassword();
exports.saveFcmToken = userFactory.saveFcmToken();
exports.logout = userFactory.logout();
exports.createRole = userFactory.createRole()
exports.getUserRoles = userFactory.getUserRoles()

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const { value: validQuery, error } = GETJoiSchema.validate(req.query);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  req.query = validQuery;

  const query = { isSuperAdmin: false, role: null };
  handlerFactory.getAll(User, '', logger, query)(req, res, next);
});

exports.getAllAdminUsers = catchAsync(async (req, res, next) => {
  const { value: validQuery, error } = GETJoiSchema.validate(req.query);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  req.query = validQuery;

  // const query = { isSuperAdmin: false, role: { $ne: null } };
  const query = { isSuperAdmin: false};
  handlerFactory.getAll(User, 'role', logger, query)(req, res, next);
});

exports.getSingleUser = handlerFactory.getOne(User, '', logger);
exports.updateUser = catchAsync(async (req, res, next) => {
  const { value: validData, error } = PATCHJoiSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  req.body = validData;
  handlerFactory.updateOne(User, logger)(req, res, next);
});
exports.deleteUser = handlerFactory.deleteOne(User, logger);

const updateProfileValidations = Joi.object({
  country: country.optional(),
  gender: gender.optional(),
  dateOfBirth: dateOfBirth.optional(),
}).strict();

exports.updateProfile = catchAsync(async (req, res, next) => {
  const user = req.user;
  const { error } = updateProfileValidations.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  if (req.file) {
    req.body.image = req.file.location;
  }

  const updatedUser = await User.findByIdAndUpdate(user?._id, req.body, {
    runValidators: true,
    new: true,
  }).select('-password');

  sendSuccessResponse(res, 200, logger, {
    message: 'Profile updated successfully.',
    doc: updatedUser,
  });
});

exports.sendContactEmail = catchAsync(async (req, res, next) => {
  try {
    await sendContactEmail(req.body);
    sendSuccessResponse(res, 200, logger, {
      message: 'Message sent successfully.',
    });
  } catch (error) {
    console.log({ error });
    return next(new AppError('Somehting went wrong.', 500));
  }
});

exports.deleteMyAccount = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  await User.findByIdAndUpdate(userId, { status: 'deleted' });
  sendSuccessResponse(res, 200, logger, {
    message: 'Your account deactivated successfully.',
  });
});

exports.dashboardStats = catchAsync(async (req, res, next) => {
  const inventoryStats = await Inventory.aggregate([
    {
      $facet: {
        totalActiveInventory: [
          { $match: { status: { $nin: ['deleted'] } } },
          { $count: 'count' },
        ],
        availableForBooking: [
          { $match: { status: 'not_assigned' } },
          { $count: 'count' },
        ],
      },
    },
  ]);

  function getCount(key) {
    return inventoryStats[0][key]?.[0]?.count || 0;
  }

  sendSuccessResponse(res, 200, logger, {
    headline: {
      totalActiveInventory: getCount('totalActiveInventory'),
      availableForBooking: getCount('availableForBooking'),
    },
  });
});
