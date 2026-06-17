const Vehicle = require("../models/vehicleModel");
const AppError = require("../utils/appError");
const { sendSuccessResponse } = require("../utils/helpers");  
const { vehicleValidation, GETJoiVehicleSchema, PATCHJoiVehicleSchema } = require("../validations/vehicleValidations");
const catchAsync = require('../utils/catchAsync');
const logger = require("../logger")("Vehicle_CONTROLLER");
const handlerFactory = require('./factories/handlerFactory');


exports.addVehicle =  catchAsync( async (req, res, next) => {

    try {
         let { vehicleNo , ownerName,typeVehicle ,status} = req.body;

         

    const { error } = vehicleValidation.validate(req.body);
    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }

    const vehicle = await Vehicle.findOne({ vehicleNo });
    if(vehicle){
        return next(new AppError("Vehicle already exists",400))
    }

    await Vehicle.create({
        vehicleNo,
        ownerName,
        typeVehicle,
        status
    })
    return sendSuccessResponse(res, 201, logger, {
            message: "Vehicle Addedd successfully.",
        });

    } catch (error) {
       console.log("CREATE VEHICLE ERROR:", error);
  return next(new AppError(error.message, 500));
    }
 
});
exports.getVehicle = handlerFactory.getOne(Vehicle, logger);

exports.getAllVehiles = catchAsync(async (req, res, next) => {
  const { value: validQuery, error } = GETJoiVehicleSchema.validate(req.query);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  req.query = validQuery;

  const query = {}
  handlerFactory.getAll(Vehicle, '', logger, query)(req, res, next);
});


exports.updateVehicle = catchAsync(async (req, res, next) => {
  const { value: validData, error } = PATCHJoiVehicleSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  // Prevent changing vehicle plate numbers to something already registered
  if (validData.vehicleNo) {
    const duplicateVehicle = await Vehicle.findOne({
      vehicleNo: validData.vehicleNo,
      _id: { $ne: req.params.id }
    });
    if (duplicateVehicle) {
      return next(new AppError("This vehicle registration number is already in use.", 400));
    }
  }

  req.body = validData;
  handlerFactory.updateOne(Vehicle, logger)(req, res, next);
});

// Delete vehicle from registry
exports.deleteVehicle = handlerFactory.deleteOne(Vehicle, logger);

exports.getVehicleDropdownList = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ status: "Active" }) 
      .select("_id vehicleNo")
      .lean();

  
     sendSuccessResponse(res,200,logger,{
      message:"clients dropdown list",
      docs:vehicles
    })
    
  } catch (error) {
        return next(new AppError(error.message, 500));
  }
};