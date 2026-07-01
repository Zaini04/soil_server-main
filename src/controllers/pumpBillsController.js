const PumpBills = require("../models/pumpBills");
const APIFeatures = require("../utils/APIFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { sendSuccessResponse } = require("../utils/helpers");
const { POSTJoiPumpBillsSchema, entryPumpBillsSchema, GETJoiPumpBillsSchema } = require("../validations/pumpBillsValidation");
const logger = require("../logger")("OfficeExpense_CONTROLLER");
const handlerFactory = require('./factories/handlerFactory');

const PumpBillsRecordColumns = [
  { header: "Date",     key: "date",         width: 65,  getValue: (r) => new Date(r.date).toLocaleDateString("en-GB") },
  { header: "Slip No",    key: "slipNo",      width: 50,  getValue: (r) => r.slipNo || "" },
  { header: "Vehicle",  key: "vehicle",      width: 60,  getValue: (r) => r.vehicle?.vehicleNo || "", wrap: true },
  { header: "Fuel Company",  key: "fuelCompany",      width: 60,  getValue: (r) => r.fuelCompany?.fuelCompany || "", wrap: true },
  { header: "Today's Diesel Rate",  key: "todayDieselRate",      width: 60,  getValue: (r) => r.todayDieselRate || "", wrap: true },
  { header: "Total Liters",  key: "totalLiters",      width: 60,  getValue: (r) => r.totalLiters || "", wrap: true },
  { header: "Lose Oil Liters",  key: "totalLoseOilLiters",      width: 60,  getValue: (r) => r.totalLoseOilLiters || "", wrap: true },
  { header: "Lose Oil Amount",  key: "totalLoseOilAmount",      width: 60,  getValue: (r) => r.totalLoseOilAmount || "", wrap: true },
  { header: "Total Amount",  key: "totalAmounts",      width: 60,  getValue: (r) => r.totalAmounts || "", wrap: true },

];
 
const pumpBillsTotals = [
      { label: "Total Amount",    field: "totalAmounts" , prefix: "Rs. "},

];
 
const pumpBillsPopulate = [
 { path: "vehicle", select: "vehicleNo" },
    { path: "fuelCompany", select: "fuelCompany" },


];


exports.exportPumpBillsRecordsExcel = handlerFactory.exportExcel(PumpBills, {
  buildQuery: (req) => ({}),
  dateField: "date",
  populate: pumpBillsPopulate,
  columns: PumpBillsRecordColumns,
  totalsConfig: pumpBillsTotals,
  sheetName: "Pump Bills Records",
});
 
exports.exportPumpBillsRecordsPdf = handlerFactory.exportPdf(PumpBills, {
  buildQuery: (req) => ({}),
  dateField: "date",
  populate: pumpBillsPopulate,
  columns: PumpBillsRecordColumns,
  totalsConfig: pumpBillsTotals,
  title:  "Pump Bills Records",
});

exports.entryPumpBills = catchAsync(async (req, res, next) => {
    const { value: validData, error } = POSTJoiPumpBillsSchema.validate(req.body);
    if(error) {
        return next(new AppError(error.details[0].message, 400));
    }
    req.body = validData;
    handlerFactory.createOne(PumpBills, entryPumpBillsSchema, logger)(req, res, next);
})

exports.getAllPumpBills = catchAsync(async (req, res, next) => {
    const { value: validQuery, error } = GETJoiPumpBillsSchema.validate(req.query);
    if(error) {
        return next(new AppError(error.details[0].message, 400));
    }
    req.query = validQuery;
     const query = {}
  const populateOptions = [
    { path: "createdBy", select: "username" },
    { path: "vehicle", select: "vehicleNo" },
    { path: "fuelCompany", select: "fuelCompany" },
    
    
  ];
    handlerFactory.getAll(PumpBills, populateOptions, logger, query,"date")(req, res, next);
})

exports.updatePumpBillEntry = catchAsync(async (req, res, next) => {
  const { value: validData, error } = POSTJoiPumpBillsSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  req.body = validData;
  handlerFactory.updateOne(PumpBills, logger)(req, res, next);
});

exports.deletePumpBillEntry = handlerFactory.removeFromDb(PumpBills, logger);
