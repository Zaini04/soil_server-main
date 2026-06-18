const Fuel = require("../models/fuelCompany"); // Adjust matching folder path
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const handlerFactory = require('./factories/handlerFactory');
const { POSTJoiFuelSchema, GETJoiFuelSchema, PATCHJoiFuelSchema } = require("../validations/fuelValidations");
const FuelStock = require("../models/FuelStock");
const FuelCompany = require("../models/fuelCompany");
const { sendSuccessResponse } = require("../utils/helpers");
const EntryVehicle = require("../models/entryVehicleModal");

const logger = require("../logger")("FuelStock_CONTROLLER");

exports.addFuelStock = catchAsync(async (req, res, next) => {
  // 1. Validate incoming data
  const { value: validData, error } = POSTJoiFuelSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  // Trim aur lowercase karein taake Shell, shell, aur SHELL sab ek hi count hon
  const fuelCompany = validData.fuelCompany.trim().toLowerCase();
  const fuelLiters = validData.fuelLiters;

  // 2. Clear & Safe Upsert Query
  const updatedStock = await FuelStock.findOneAndUpdate(
    { fuelCompany: fuelCompany }, // Simple string match (No Regex confusion)
    { 
      $inc: { fuelLiters: fuelLiters },
      $setOnInsert: { fuelCompany: fuelCompany } // Naye document ke liye lazmi set karega
    },
    { 
      new: true,          
      upsert: true,       
      runValidators: true 
    }
  );

  // 3. Send Response
  res.status(200).json({
    status: "success",
    message: "Fuel stock processed successfully.",
    data: {
      fuelStock: updatedStock,
    },
  });
});
// exports.getAllFuelRecords = handlerFactory.getAll(Fuel, logger);
exports.getAllFuelStock = catchAsync(async (req, res, next) => {
const { value: validQuery, error } = GETJoiFuelSchema.validate(req.query);
    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }
    req.query = validQuery;

    const query = {};

      const populateOptions = [
    { path: "fuelCompany", select: "fuelCompany" },
  ];
    handlerFactory.getAll(FuelStock, populateOptions, logger, query)(req, res, next);
  })


exports.updateFuelStock = catchAsync(async (req, res, next) => {
  const { value: validData, error } = PATCHJoiFuelSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  req.body = validData;
  handlerFactory.updateOne(FuelStock, logger)(req, res, next);
});

exports.deleteFuelStock = handlerFactory.removeFromDb(FuelStock, logger);


exports.getAllFuelStockCompanies = async (req, res, next) => {
  try {
    const fuelcompanies = await FuelCompany.find() 
      .select("_id fuelCompany")
      .lean();

  
     sendSuccessResponse(res,200,logger,{
      message:"Fuel Companies list",
      docs:fuelcompanies
    })
    
  } catch (error) {
        return next(new AppError(error.message, 500));
  }
};


exports.getAllFuelCompaniesWithStock = catchAsync(async (req, res, next) => {
  const companiesWithStock = await FuelCompany.aggregate([
    {
      $lookup: {
        from: "fuelstocks",
        localField: "_id",
        foreignField: "fuelCompany",
        as: "stockInfo"
      }
    },
    {
      $project: {
        _id: 1,
        fuelCompany: 1,
        availableStock: { $ifNull: [{ $sum: "$stockInfo.fuelLiters" }, 0] },
        hasStock: { $gt: [{ $size: "$stockInfo" }, 0] }
      }
    },
    { $sort: { fuelCompany: 1 } }
  ]);

  sendSuccessResponse(res, 200, logger, {
    message: "Fuel companies list with available stock details fetched.",
    docs: companiesWithStock
  });
});

exports.getEntryFuels = catchAsync(async (req, res, next) => {
  const { value: validQuery, error } = GETJoiFuelSchema.validate(req.query);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  req.query = validQuery;

  // Default specific fields — frontend override kar sakta hai
  if (!req.query.fields) {
    req.query.fields = "_id,createdAt,vehicle,fuelCompany,dieselInLitters,dieselCost";
  }

  handlerFactory.getAll(
    EntryVehicle,
    [
      { path: "vehicle", select: "vehicleNo typeVehicle" },
      { path: "fuelCompany", select: "fuelCompany" },
    ],
    logger,
    {}
  )(req, res, next);
});
