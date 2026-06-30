const OfficeExpense = require("../models/officeExpenseModel");
const APIFeatures = require("../utils/APIFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { sendSuccessResponse } = require("../utils/helpers");
const { POSTJoiCompanyRecordsSchema, GETJoiCompanyRecordsSchema } = require("../validations/companyRecordsValidation");
const { POSTJoiOfficeExpenseSchema, OfficeExpenseSchema, GETJoiOfficeExpenseSchema } = require("../validations/officeExpenseValidations");
const logger = require("../logger")("OfficeExpense_CONTROLLER");
const handlerFactory = require('./factories/handlerFactory');


const ExpenseRecordColumns = [
  { header: "Date",     key: "date",         width: 65,  getValue: (r) => new Date(r.date).toLocaleDateString("en-GB") },
  { header: "Expense Type",    key: "expenseType",      width: 50,  getValue: (r) => r.expenseType || "" },
  { header: "Employee Name",  key: "employeeName",      width: 60,  getValue: (r) => r.employeeName || "", wrap: true },
  { header: "Amount",  key: "amount",      width: 60,  getValue: (r) => r.amount || "", wrap: true },
  { header: "Remarks",  key: "remarks",      width: 80,  getValue: (r) => r.remarks || "", wrap: true },

];
 
const expenseTotals = [
      { label: "Total Amount",    field: "amount" , prefix: "Rs. "},

];
 
const expenseRecordPopulate = [];


exports.exportExpenseRecordsExcel = handlerFactory.exportExcel(OfficeExpense, {
  buildQuery: (req) => ({}),
  dateField: "date",
  populate: expenseRecordPopulate,
  columns: ExpenseRecordColumns,
  totalsConfig: expenseTotals,
  sheetName: "Expense Records",
});
 
exports.exportExpenseRecordsPdf = handlerFactory.exportPdf(OfficeExpense, {
  buildQuery: (req) => ({}),
  dateField: "date",
  populate: expenseRecordPopulate,
  columns: ExpenseRecordColumns,
  totalsConfig: expenseTotals,
  title:  "Expense Records",
});


exports.addOfficeExpense= catchAsync(async (req,res, next)=>{
    const { value: validData, error } = POSTJoiOfficeExpenseSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  
  req.body = validData;
  handlerFactory.createOne(OfficeExpense,OfficeExpenseSchema, logger)(req, res, next);
})

exports.getAllOfficeExpense = catchAsync(async (req,res, next)=>{

     const { value: validQuery, error } = GETJoiOfficeExpenseSchema.validate(req.query);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  req.query = validQuery;

  const query = {}
  const populateOptions = [
    { path: "createdBy", select: "username" },
    
  ];

  handlerFactory.getAll(OfficeExpense, populateOptions, logger, query)(req, res, next)
})