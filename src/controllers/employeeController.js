const AppError = require("../utils/appError");
const { sendSuccessResponse } = require("../utils/helpers");  
const catchAsync = require('../utils/catchAsync');
const logger = require("../logger")("Emloyee_CONTROLLER");
const handlerFactory = require('./factories/handlerFactory');
const Employee = require("../models/EmployeeModel");
const { EmployeeValidation, GETJoiEmployeeSchema, PATCHJoiEmployeeSchema } = require("../validations/EmployeeValidations");
const { POSTJoiEmployeeExpenseSchema, EmployeeExpenseSchema, GETJoiEmployeeExpenseSchema } = require("../validations/employeeExpenseValidation");
const EmployeeExpense = require("../models/EmployeExpense");


const employeeRecordColumns = [
  { header: "Date",     key: "date",         width: 65,  getValue: (r) => new Date(r.createdAt).toLocaleDateString("en-GB") },
  { header: "Employee Name",    key: "name",      width: 50,  getValue: (r) => r.name || "" },
  { header: "Phone No",  key: "phoneNumber",      width: 60,  getValue: (r) => r.phoneNumber || "", wrap: true },
  { header: "Location",  key: "city",      width: 60,  getValue: (r) => r.city || "", wrap: true },
  { header: "Status",  key: "status",      width: 60,  getValue: (r) => r.status || "", wrap: true },
  { header: "Monthly Salary",  key: "monthlySalary",      width: 60,  getValue: (r) => r.monthlySalary || "", wrap: true },

];
 
const employeeTotals = [];
 
const employeeRecordPopulate = [];
const getExportPeriod = (req) => {
  const { from, to } = req.query;
  if (from && to) {
    const startDate = new Date(from);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(to);
    endDate.setUTCHours(23, 59, 59, 999);
    return { startDate, endDate };
  }
  const now = new Date();
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { startDate, endDate };
};

const fetchAllEmployeesSummary = async (req) => {
  const { startDate, endDate } = getExportPeriod(req);

  const agg = await EmployeeExpense.aggregate([
    { $match: { date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: "$employee", totalExpense: { $sum: "$amount" } } },
  ]);

  const expenseMap = {};
  agg.forEach((e) => (expenseMap[e._id.toString()] = e.totalExpense));

  const employees = await Employee.find({ status: "Active" })
    .select("name phoneNumber monthlySalary")
    .lean();

  return employees.map((emp) => {
    const totalExpense = expenseMap[emp._id.toString()] || 0;
    return {
      ...emp,
      totalExpense,
      remainingSalary: emp.monthlySalary - totalExpense,
    };
  });
};

const employeeSummaryColumns = [
  { header: "Employee",         key: "name",            width: 60, getValue: (r) => r.name || "" },
  { header: "Phone",            key: "phoneNumber",     width: 50, getValue: (r) => r.phoneNumber || "" },
  { header: "Monthly Salary",   key: "monthlySalary",   width: 50, getValue: (r) => r.monthlySalary ?? 0 },
  { header: "Total Expense",    key: "totalExpense",    width: 50, getValue: (r) => r.totalExpense ?? 0 },
  { header: "Remaining Salary", key: "remainingSalary", width: 50, getValue: (r) => r.remainingSalary ?? 0 },
];

const employeeSummaryTotals = (records) => ({
  monthlySalary: records.reduce((sum, r) => sum + (r.monthlySalary || 0), 0),
  totalExpense: records.reduce((sum, r) => sum + (r.totalExpense || 0), 0),
  remainingSalary: records.reduce((sum, r) => sum + (r.remainingSalary || 0), 0),
});

const employeeSummaryTotalsConfig = [
  { label: "TOTAL Salary", field: "monthlySalary", prefix: "Rs. " },
  { label: "TOTAL Expense", field: "totalExpense", prefix: "Rs. " },
  { label: "TOTAL Remaining", field: "remainingSalary", prefix: "Rs. " },
];

const fetchSingleEmployeeExpenseRecords = async (req) => {
  const { startDate, endDate } = getExportPeriod(req);

  return EmployeeExpense.find({
    employee: req.query.employee,
    date: { $gte: startDate, $lte: endDate },
  })
    .populate([
      { path: "createdBy", select: "username" },
      { path: "employee", select: "name phoneNumber monthlySalary" },
    ])
    .sort({ date: -1 });
};

const employeeExpenseDetailColumns = [
  { header: "Date", key: "date", width: 55, getValue: (r) => new Date(r.date).toLocaleDateString("en-GB") },
  { header: "Employee", key: "employee", width: 55, getValue: (r) => r.employee?.name || ""},
  { header: "Amount", key: "amount", width: 50, getValue: (r) => r.amount ?? 0 },
  { header: "Notes", key: "notes", width: 80, getValue: (r) => r.notes || "", wrap: true },
];

const employeeExpenseDetailTotals = (records) => {
  const monthlySalary = records[0]?.employee?.monthlySalary || 0;
  const totalExpense = records.reduce((sum, r) => sum + (r.amount || 0), 0);
  return {
    monthlySalary,
    totalExpense,
    remainingSalary: monthlySalary - totalExpense,
  };
};

const employeeExpenseDetailTotalsConfig = [
  { label: "Monthly Salary", field: "monthlySalary", prefix: "Rs. " },
  { label: "Total Expense", field: "totalExpense", prefix: "Rs. " },
  { label: "Remaining Salary", field: "remainingSalary", prefix: "Rs. " },
];

const fetchSelectedExpenseRecords = async (req) => {
  const { ids = [] } = req.body || {};

  return EmployeeExpense.find({ _id: { $in: ids } })
    .populate([
      { path: "createdBy", select: "username" },
      { path: "employee", select: "name phoneNumber monthlySalary" },
    ])
    .sort({ date: -1 });
};

const selectedExpenseTotals = (records) => {
  const uniqueEmployees = [...new Set(records.map((r) => r.employee?._id?.toString()))];
  const totalExpense = records.reduce((sum, r) => sum + (r.amount || 0), 0);

  if (uniqueEmployees.length === 1) {
    const monthlySalary = records[0]?.employee?.monthlySalary || 0;
    return {
      monthlySalary,
      totalExpense,
      remainingSalary: monthlySalary - totalExpense,
    };
  }

  return { totalExpense };
};

const selectedExpenseTotalsConfig = (records) => {
  const uniqueEmployees = [...new Set(records.map((r) => r.employee?._id?.toString()))];
  const base = [{ label: "TOTAL Expense", field: "totalExpense", prefix: "Rs. " }];
  if (uniqueEmployees.length === 1) {
    base.unshift({ label: "Monthly Salary", field: "monthlySalary", prefix: "Rs. " });
    base.push({ label: "Remaining Salary", field: "remainingSalary", prefix: "Rs. " });
  }
  return base;
};

exports.exportEmployeeExpenseExcel = catchAsync(async (req, res, next) => {
  const hasSelectedIds = Array.isArray(req.body?.ids) && req.body.ids.length > 0;
  const isSingleEmployee = !hasSelectedIds && !!req.query.employee;

  if (hasSelectedIds) {
    return handlerFactory.exportExcel(EmployeeExpense, {
      fetchRecords: fetchSelectedExpenseRecords,
      getTotals: selectedExpenseTotals,
      columns: employeeExpenseDetailColumns,
      totalsConfig: selectedExpenseTotalsConfig,
      sheetName: "Expense Records",
    })(req, res, next);
  }

  if (isSingleEmployee) {
    const emp = await Employee.findById(req.query.employee).select("name");
    const employeeName = emp?.name || "Employee";
    return handlerFactory.exportExcel(EmployeeExpense, {
      fetchRecords: fetchSingleEmployeeExpenseRecords,
      getTotals: employeeExpenseDetailTotals,
      columns: employeeExpenseDetailColumns,
      totalsConfig: employeeExpenseDetailTotalsConfig,
      sheetName: `${employeeName} - Expense Detail`,
    })(req, res, next);
  }

  return handlerFactory.exportExcel(EmployeeExpense, {
    fetchRecords: fetchAllEmployeesSummary,
    getTotals: employeeSummaryTotals,
    columns: employeeSummaryColumns,
    totalsConfig: employeeSummaryTotalsConfig,
    sheetName: "All Employees Expense Summary",
  })(req, res, next);
});

exports.exportEmployeeExpensePdf = catchAsync(async (req, res, next) => {
  const hasSelectedIds = Array.isArray(req.body?.ids) && req.body.ids.length > 0;
  const isSingleEmployee = !hasSelectedIds && !!req.query.employee;

  if (hasSelectedIds) {
    
    return handlerFactory.exportPdf(EmployeeExpense, {
      fetchRecords: fetchSelectedExpenseRecords,
      getTotals: selectedExpenseTotals,
      columns: employeeExpenseDetailColumns,
      totalsConfig: selectedExpenseTotalsConfig,
      title: ` Expense Detail`,
    })(req, res, next);
  }

  if (isSingleEmployee) {
    const emp = await Employee.findById(req.query.employee).select("name");
    const employeeName = emp?.name || "Employee";
    return handlerFactory.exportPdf(EmployeeExpense, {
      fetchRecords: fetchSingleEmployeeExpenseRecords,
      getTotals: employeeExpenseDetailTotals,
      columns: employeeExpenseDetailColumns,
      totalsConfig: employeeExpenseDetailTotalsConfig,
      title: `${employeeName} - Expense Detail`,
      toLabel:employeeName
    })(req, res, next);
  }

  return handlerFactory.exportPdf(EmployeeExpense, {
    fetchRecords: fetchAllEmployeesSummary,
    getTotals: employeeSummaryTotals,
    columns: employeeSummaryColumns,
    totalsConfig: employeeSummaryTotalsConfig,
    title: "All Employees Expense Summary",
  })(req, res, next);
});

exports.exportEmployeeRecordsExcel = handlerFactory.exportExcel(Employee, {
  buildQuery: (req) => ({}),
  dateField: "createdAt",
  populate: employeeRecordPopulate,
  columns: employeeRecordColumns,
  totalsConfig: employeeTotals,
  sheetName: "Employee Records",
});
 
exports.exportEmployeeRecordsPdf = handlerFactory.exportPdf(Employee, {
  buildQuery: (req) => ({}),
  dateField: "createdAt",
  populate: employeeRecordPopulate,
  columns: employeeRecordColumns,
  totalsConfig: employeeTotals,
  title:  "Employee Records",
});

exports.addEmployee = catchAsync(async (req, res, next) => {
    try {
        const { 
            name, 
            fatherOrHusbandName, 
            cnicOrNicop, 
            phoneNumber, 
            whatsAppNumber, 
            email, 
            address, 
            city,
            state,
            status, 
            image ,
            monthlySalary,
        } = req.body;

        const { error } = EmployeeValidation.validate(req.body);
        if (error) {
            return next(new AppError(error.details[0].message, 400));
        }

        const employeeExists = await Employee.findOne({ cnicOrNicop });
        if (employeeExists) {
            return next(new AppError("Employee with this CNIC/NICOP already exists.", 400));
        }
        
        if(!monthlySalary){
         return next(new AppError("Employee Salary is Required.", 400));

        }

        await Employee.create({
            name,
            fatherOrHusbandName,
            cnicOrNicop,
            phoneNumber,
            whatsAppNumber,
            email,
            address, 
            city,
            state,
            status,
            image,
            monthlySalary,
            createdBy:req.user._id
        });

        return sendSuccessResponse(res, 201, logger, {
            message: "Employee added successfully.",
        });

    } catch (error) {
        console.log("CREATE Employee ERROR:", error);
        return next(new AppError(error.message, 500));
    }
});

exports.getAllEmployee = catchAsync(async (req, res, next) => {
    const { value: validQuery, error } = GETJoiEmployeeSchema.validate(req.query);
    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }
    req.query = validQuery;

    const query = {};
    const populateOptions = [
    { path: "createdBy", select: "username" },
  ];
    handlerFactory.getAll(Employee, populateOptions, logger, query)(req, res, next);
});


exports.updateEmployee = catchAsync(async (req, res, next) => {
  const { value: validData, error } = PATCHJoiEmployeeSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  if (validData.cnicOrNicop) {
    const duplicateEmployee = await Employee.findOne({
      cnicOrNicop: validData.cnicOrNicop,
      _id: { $ne: req.params.id }
    });
    if (duplicateEmployee) {
      return next(new AppError("This CNIC / NICOP number is already assigned to another Employee.", 400));
    }
  }

  req.body = validData;
  handlerFactory.updateOne(Employee, logger)(req, res, next);
});

exports.deleteEmployee = handlerFactory.deleteOne(Employee, logger);


exports.getEmployeeDropdownList = async (req, res, next) => {
  try {
    const employess = await Employee.find({ status: "Active" }) 
      .select("_id name phoneNumber")
      .lean();

  
     sendSuccessResponse(res,200,logger,{
      message:"employee dropdown list",
      docs:employess
    })
    
  } catch (error) {
        return next(new AppError(error.message, 500));
  }
};




exports.addEmployeeExpense = catchAsync(async (req, res, next) => {
  const { value: validData, error } = POSTJoiEmployeeExpenseSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const employee = await Employee.findById(validData.employee).select("monthlySalary name");
  if (!employee) {
    return next(new AppError("Employee not found.", 404));
  }

  // Expense ki date ke month ki range nikalein
  const expenseDate = new Date(validData.date || Date.now());
  const monthStart = new Date(Date.UTC(expenseDate.getUTCFullYear(), expenseDate.getUTCMonth(), 1, 0, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(expenseDate.getUTCFullYear(), expenseDate.getUTCMonth() + 1, 0, 23, 59, 59, 999));

  const existingAgg = await EmployeeExpense.aggregate([
    {
      $match: {
        employee: employee._id,
        date: { $gte: monthStart, $lte: monthEnd },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const alreadySpent = existingAgg[0]?.total || 0;
  const remaining = employee.monthlySalary - alreadySpent;

  if (validData.amount > remaining) {
    return next(
      new AppError(
        `Expense exceeds remaining salary. Remaining for this month: ${remaining}, Requested: ${validData.amount}.`,
        400
      )
    );
  }

  req.body = validData;
  handlerFactory.createOne(EmployeeExpense, EmployeeExpenseSchema, logger)(req, res, next);
});

exports.getAllEmployeeExpense = catchAsync(async (req, res, next) => {
  const { value: validQuery, error } = GETJoiEmployeeExpenseSchema.validate(req.query);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  req.query = validQuery;

  // Default: current month, agar user ne from/to nahi bheja
  if (!req.query.from && !req.query.to) {
    const now = new Date();
    req.query.from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    req.query.to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)).toISOString();
  }

  const query = {};
  const populateOptions = [
    { path: "createdBy", select: "username" },
    { path: "employee", select: "name phoneNumber monthlySalary city status" },
  ];

  handlerFactory.getAll(EmployeeExpense, populateOptions, logger, query, "date")(req, res, next);
});
exports.updateEmployeeExpense = catchAsync(async (req, res, next) => {
  const { value: validData, error } = POSTJoiEmployeeExpenseSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const existingExpense = await EmployeeExpense.findById(req.params.id);
  if (!existingExpense) {
    return next(new AppError("Expense record not found.", 404));
  }

  const employee = await Employee.findById(existingExpense.employee).select("monthlySalary name");
  if (!employee) {
    return next(new AppError("Employee not found.", 404));
  }

  const expenseDate = new Date(validData.date || existingExpense.date);
  const monthStart = new Date(Date.UTC(expenseDate.getUTCFullYear(), expenseDate.getUTCMonth(), 1, 0, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(expenseDate.getUTCFullYear(), expenseDate.getUTCMonth() + 1, 0, 23, 59, 59, 999));

  const existingAgg = await EmployeeExpense.aggregate([
    {
      $match: {
        employee: employee._id,
        date: { $gte: monthStart, $lte: monthEnd },
        _id: { $ne: existingExpense._id },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const alreadySpent = existingAgg[0]?.total || 0;
  const remaining = employee.monthlySalary - alreadySpent;

  if (validData.amount > remaining) {
    return next(
      new AppError(
        `Expense exceeds remaining salary. Remaining for this month: ${remaining}, Requested: ${validData.amount}.`,
        400
      )
    );
  }

  req.body = validData;
  handlerFactory.updateOne(EmployeeExpense, logger)(req, res, next);
});

exports.deleteEmployeeExpense = handlerFactory.removeFromDb(EmployeeExpense, logger);


exports.getOneEmployeeExpense = handlerFactory.getOne(EmployeeExpense,[
    { path: "createdBy", select: "username" },
    {pathe:"employee",select:"name phoneNumber monthlySalary"}
  ],logger)

  exports.getEmployeeExpensesByEmployeeId = handlerFactory.getAllByField(
  EmployeeExpense,
  "employee", // Yeh schema ki field hai jahan search karna hai
  [
    { path: "createdBy", select: "username" },
    { path: "employee", select: "name monthlySalary" }
  ],
  logger,
  "date" // Jis date field par sorting vagaira apply karni ho
);


exports.getEmployeeExpenseSummary = catchAsync(async (req, res, next) => {
  const { employee, from, to } = req.query;

  if (!employee) {
    return next(new AppError("Employee id is required.", 400));
  }

  let startDate, endDate;
  if (from && to) {
    startDate = new Date(from);
    startDate.setUTCHours(0, 0, 0, 0);
    endDate = new Date(to);
    endDate.setUTCHours(23, 59, 59, 999);
  } else {
    const now = new Date();
    startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  }

  const emp = await Employee.findById(employee).select("name phoneNumber monthlySalary");
  if (!emp) {
    return next(new AppError("Employee not found.", 404));
  }

  const agg = await EmployeeExpense.aggregate([
    {
      $match: {
        employee: emp._id,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    { $group: { _id: null, totalSpent: { $sum: "$amount" } } },
  ]);

  const totalSpent = agg[0]?.totalSpent || 0;

  sendSuccessResponse(res, 200, logger, {
    employee: {
      _id: emp._id,
      name: emp.name,
      phoneNumber: emp.phoneNumber,
      monthlySalary: emp.monthlySalary,
    },
    totalSpent,
    remainingSalary: emp.monthlySalary - totalSpent,
    period: { from: startDate, to: endDate },
  });
});