const Fuel = require("../models/entryFuelModel"); // Adjust matching folder path
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const handlerFactory = require('./factories/handlerFactory');
const { POSTJoiFuelSchema, GETJoiFuelSchema, PATCHJoiFuelSchema } = require("../validations/fuelValidations");
const FuelStock = require("../models/FuelStock");
const FuelCompany = require("../models/fuelCompany");
const { sendSuccessResponse } = require("../utils/helpers");
const EntryVehicle = require("../models/entryVehicleModal");

const logger = require("../logger")("FuelStock_CONTROLLER");


const entryFuelRecordColumns = [
  { header: "Date",     key: "date",         width: 65,  getValue: (r) => new Date(r.date).toLocaleDateString("en-GB") },
  { header: "Vehicle",    key: "vehicleNo",      width: 50,  getValue: (r) => r.vehicle?.vehicleNo || "" },
  { header: "Vehicle",  key: "typeVehicle",      width: 60,  getValue: (r) => r.vehicle?.typeVehicle || "", wrap: true },
  { header: "FuelCompany",  key: "fuelCompany",      width: 60,  getValue: (r) => r.fuelCompany?.fuelCompany || "", wrap: true },
  { header: "DiesalLiters",  key: "dieselInLitters",      width: 60,  getValue: (r) => r.dieselInLitters ?? 0, wrap: true },
  { header: "TotalPrice",  key: "dieselCost",      width: 60,  getValue: (r) => r.dieselCost ?? 0, wrap: true },

];
 
const entryFuelTotals = [
  { label: "TOTAL Diesel Litters",    field: "dieselInLitters" },
  { label: "TOTAL Diesel Price", field: "dieselCost", prefix: "Rs. " },
];
 
const entryFuelRecordPopulate = [
  { path: "fuelCompany",  select: "fuelCompany" },
  { path: "vehicle", select: "vehicleNo typeVehicle" },
];

const FuelStockRecordColumns = [
  { header: "Date",     key: "date",         width: 65,  getValue: (r) => new Date(r.createdAt).toLocaleDateString("en-GB") },
  { header: "FuelCompany",  key: "fuelCompany",      width: 60,  getValue: (r) => r.fuelCompany?.fuelCompany || "", wrap: true },
  { header: "FuelLiters",  key: "fuelLiters",      width: 60,  getValue: (r) => r.fuelLiters ?? 0, wrap: true },

];
 
const FuelStockTotals = [
  { label: "TOTAL Fuel Litters",    field: "fuelLiters" },
];
 
const FuelStockRecordPopulate = [
  { path: "fuelCompany",  select: "fuelCompany" },
];



exports.exportEntryFuelRecordsExcel = handlerFactory.exportExcel(EntryVehicle, {
  buildQuery: (req) => ({}),
  dateField: "date",
  populate: entryFuelRecordPopulate,
  columns: entryFuelRecordColumns,
  totalsConfig: entryFuelTotals,
  sheetName: "Entry Fuel Records",
});
 
exports.exportEntryFuelRecordsPdf = handlerFactory.exportPdf(EntryVehicle, {
  buildQuery: (req) => ({}),
  dateField: "date",
  populate: entryFuelRecordPopulate,
  columns: entryFuelRecordColumns,
  totalsConfig: entryFuelTotals,
  title: (records) => records[0]?.client?.name || "Entry Fuel Records",
});

 

exports.exportFuelStockRecordsExcel = handlerFactory.exportExcel(FuelStock, {
  buildQuery: (req) => ({}),
  dateField: "createdAt",
  populate:FuelStockRecordPopulate ,
  columns: FuelStockRecordColumns,
  totalsConfig: FuelStockTotals,
  sheetName: "Fuel Records",
});
 
exports.exportFuelStockRecordsPdf = handlerFactory.exportPdf(FuelStock, {
  buildQuery: (req) => ({}),
  dateField: "createdAt",
  populate: FuelStockRecordPopulate,
  columns: FuelStockRecordColumns,
  totalsConfig: FuelStockTotals,
  title: (records) => records[0]?.client?.name || "Fuel Stock Records",
});

 


exports.addFuelStock = catchAsync(async (req, res, next) => {
  const { value: validData, error } = POSTJoiFuelSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const fuelCompany = validData.fuelCompany.trim().toLowerCase();
  const fuelLiters = validData.fuelLiters;

  // 2. Clear & Safe Upsert Query
  const updatedStock = await FuelStock.findOneAndUpdate(
    { fuelCompany: fuelCompany }, 
    { 
      $inc: { fuelLiters: fuelLiters },
      $set:{updatedBy:req.user._id},
      $setOnInsert: { 
        fuelCompany: fuelCompany,
        createdBy:req.user._id
       } 
    },
    { 
      new: true,          
      upsert: true,       
      runValidators: true,
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
    {path:"createdBy",select:'username'}
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
      .select("_id fuelCompany").populate("createdBy","username")
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
        hasStock: { $gt: [{ $size: "$stockInfo" }, 0] },
        createdBy:req.user._id,
        updatedBy:req.user._id
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
    req.query.fields = "_id,date,vehicle,fuelCompany,dieselInLitters,dieselCost";
  }

  handlerFactory.getAll(
    EntryVehicle,
    [
      { path: "vehicle", select: "vehicleNo typeVehicle" },
      { path: "fuelCompany", select: "fuelCompany" },
      {path:"createdBy",select:"username"}
    ],
    logger,
    {}
  )(req, res, next);
});
