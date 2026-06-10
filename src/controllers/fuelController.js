const Fuel = require("../models/fuelModel"); // Adjust matching folder path
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const handlerFactory = require('./factories/handlerFactory');
const { POSTJoiFuelSchema } = require("../validations/fuelValidations");

const logger = "FuelController";

exports.addFuelRecord = catchAsync(async (req, res, next) => {
  const { value: validData, error } = POSTJoiFuelSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  req.body = validData;
  handlerFactory.createOne(Fuel, logger)(req, res, next);
});

exports.getAllFuelRecords = handlerFactory.getAll(Fuel, logger);

exports.getFuelRecord = handlerFactory.getOne(Fuel, logger);

exports.updateFuelRecord = catchAsync(async (req, res, next) => {
  const { value: validData, error } = PATCHJoiFuelSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  req.body = validData;
  handlerFactory.updateOne(Fuel, logger)(req, res, next);
});

exports.deleteFuelRecord = handlerFactory.removeFromDb(Fuel, logger);