const Fuel = require("../models/fuelCompany"); // Adjust matching folder path
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const handlerFactory = require('./factories/handlerFactory');
const FuelStock = require("../models/FuelStock");
const FuelCompany = require("../models/fuelCompany");
const { POSTJoiFuelCompanySchema, PATCHJoiFuelCompanySchema, GETJoiFuelCompanySchema } = require("../validations/fuelCompanyValidation");

const logger = require("../logger")("FuelCompany_CONTROLLER");

exports.addFuelCompany = catchAsync(async (req, res, next) => {
  // 1. Validate incoming data
  const { value: validData, error } = POSTJoiFuelCompanySchema.validate(req.body);

  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

//   const {fuelCompany} = req.body

//   const isFuelCompanyExists = await FuelCompany.find({fuelCompany:fuelCompany})

//   if(isFuelCompanyExists){
//         return next(new AppError("fuel company already exists", 400));

//   }
handlerFactory.createOne(FuelCompany,POSTJoiFuelCompanySchema,logger)(req, res, next)
  
});
// exports.getAllFuelRecords = handlerFactory.getAll(Fuel, logger);
exports.getAllFuelCompanies = catchAsync(async (req, res, next) => {
const { value: validQuery, error } = GETJoiFuelCompanySchema.validate(req.query);
    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }
    req.query = validQuery;

    const query = {};
    handlerFactory.getAll(FuelCompany, '', logger, query)(req, res, next);
  })


exports.updateFuelCompany = catchAsync(async (req, res, next) => {
  const { value: validData, error } = PATCHJoiFuelCompanySchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  req.body = validData;
  handlerFactory.updateOne(FuelCompany, logger)(req, res, next);
});

exports.deleteFuelCompany = handlerFactory.removeFromDb(FuelCompany, logger);


// exports.getClientDropdownList = async (req, res, next) => {
//   try {
//     const clients = await Client.find({ status: "Active" }) 
//       .select("_id name")
//       .lean();

  
//      sendSuccessResponse(res,200,logger,{
//       message:"clients dropdown list",
//       docs:clients
//     })
    
//   } catch (error) {
//         return next(new AppError(error.message, 500));
//   }
// };