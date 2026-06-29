const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { 
  POSTJoiEntryVehicleSchema, 
  GETJoiEntryVehicleSchema, 
  PATCHJoiEntryVehicleSchema, 
  entryVehicleValidation 
} = require("../validations/entryVehicleValidations");
const EntryVehicle = require("../models/entryVehicleModal");
const handlerFactory = require('./factories/handlerFactory');
const { sendSuccessResponse } = require("../utils/helpers");
const Client = require("../models/clientModel");
const Vehicle = require("../models/vehicleModel");
const FuelStock = require("../models/FuelStock");
const APIFeatures = require("../utils/APIFeatures");

const logger = require("../logger")("EntryVehicle_CONTROLLER");



const incomeExpenseRecordColumns = [
  { header: "Date",     key: "date",         width: 65,  getValue: (r) => new Date(r.date).toLocaleDateString("en-GB") },
  { header: "Vehicle",    key: "vehicleNo",      width: 50,  getValue: (r) => r.vehicle?.vehicleNo || "" },
  { header: "Vehicle",  key: "typeVehicle",      width: 60,  getValue: (r) => r.vehicle?.typeVehicle || "", wrap: true },
  { header: "Total Rate",  key: "totalRate",      width: 60,  getValue: (r) => r.totalRate ?? 0, wrap: true },
  { header: "TotalExpense",  key: "totalExpense",      width: 60,  getValue: (r) => (r.totalRate - r.remainingAmount) ?? 0, wrap: true },
  { header: "Remaining Amount",  key: "remainingAmount",      width: 60,  getValue: (r) => r.remainingAmount ?? 0, wrap: true },

];
 
const incomeExpenseTotals = [
  { label: "TOTAL Rate",    field: "totalRate" , prefix: "Rs. "},
  { 
    label: "TOTAL Expense",     
    field: "totalExpense",      
    prefix: "Rs. ",
    compute: (r) => (r.totalRate - r.remainingAmount) 
  },
  { label: "TOTAL  Remaining", field: "remainingAmount", prefix: "Rs. " },
];
 
const incomeExpenseRecordPopulate = [
  { path: "vehicle", select: "vehicleNo typeVehicle" },
];

const entryVehiclesRecordColumns = [
  { header: "Date",     key: "date",         width: 70,  getValue: (r) => new Date(r.date).toLocaleDateString("en-GB") },
  { header: "Vehicle",    key: "vehicleNo",      width: 50,  getValue: (r) => r.vehicle?.vehicleNo || "" },
  { header: "Client",  key: "client",      width: 60,  getValue: (r) => r.client?.name || "", wrap: true },
  { header: "Site",  key: "site",      width: 55,  getValue: (r) => r.site?.siteName || "", wrap: true },
  { header: "Material",  key: "material",      width: 60,  getValue: (r) => r.materialType || "", wrap: true },
  { header: "Fuel ",  key: "fuelCompany",      width: 50,  getValue: (r) => r.fuelCompany?.fuelCompany || "", wrap: true },
  { header: "Litters",  key: "dieselInLitters",      width: 50,  getValue: (r) => r.dieselInLitters || "", wrap: true },
  { header: "Rate",  key: "totalRate",      width: 60,  getValue: (r) => r.totalRate ?? 0, wrap: true },
  { header: "Expense",  key: "totalExpense",      width: 60,  getValue: (r) => (r.totalRate - r.remainingAmount) ?? 0, wrap: true },
  { header: "Rem Amount",  key: "remainingAmount",      width: 60,  getValue: (r) => r.remainingAmount ?? 0, wrap: true },
  { header: "Rec Amount",  key: "receivedAmount",      width: 60,  getValue: (r) => r.payment?.amountReceived ?? 0, wrap: true },
  { header: "Due Amount",  key: "DueAmount",      width: 60,  getValue: (r) => r.clientDue ?? 0, wrap: true },

];
 
const entryVehiclesTotals = [
  { label: "TOTAL Rate",    field: "totalRate" , prefix: "Rs. "},
  { 
    label: "TOTAL Expense",     
    field: "totalExpense",      
    prefix: "Rs. ",
    compute: (r) => (r.totalRate - r.remainingAmount) 
  },
  { label: "TOTAL  Remaining", field: "remainingAmount", prefix: "Rs. " },
  { label: "TOTAL  Received", field: "amountReceived", prefix: "Rs. " },
  { label: "TOTAL  Remaining", field: "clientDue", prefix: "Rs. " },
];
 
const entryVehiclesRecordPopulate = [
  { path: "vehicle", select: "vehicleNo " },
  { path: "client", select: "name " },
  { path: "site", select: "siteName " },
  { path: "fuelCompany", select: "fuelCompany" },

];

exports.exportIncomeExpenseRecordsExcel = handlerFactory.exportExcel(EntryVehicle, {
  buildQuery: (req) => ({}),
  dateField: "date",
  populate: incomeExpenseRecordPopulate,
  columns: incomeExpenseRecordColumns,
  totalsConfig: incomeExpenseTotals,
  sheetName: "Income Expense Records",
});
 
exports.exportIncomeExpenseRecordsPdf = handlerFactory.exportPdf(EntryVehicle, {
  buildQuery: (req) => ({}),
  dateField: "date",
  populate: incomeExpenseRecordPopulate,
  columns: incomeExpenseRecordColumns,
  totalsConfig: incomeExpenseTotals,
  title:  "Income Expense Records",
});

exports.exportEntryVehicleRecordsExcel = handlerFactory.exportExcel(EntryVehicle, {
  buildQuery: (req) => ({}),
  dateField: "date",
  populate: entryVehiclesRecordPopulate,
  columns: entryVehiclesRecordColumns,
  totalsConfig: entryVehiclesTotals,
  sheetName: "Entry Vehicle Records",
});
 
exports.exportEntryVehicleRecordsPdf = handlerFactory.exportPdf(EntryVehicle, {
  buildQuery: (req) => ({}),
  dateField: "date",
  dateField: "date",
  populate: entryVehiclesRecordPopulate,
  columns: entryVehiclesRecordColumns,
  totalsConfig: entryVehiclesTotals,
  title:  "Entry Vehicle Records",
});




exports.entryVehicle = catchAsync(async (req, res, next) => {
  console.log(req.body)

  const { value: validData, error } = POSTJoiEntryVehicleSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const { fuelCompany, dieselInLitters, isStockManaged } = validData;


  // Sirf stock managed company ka check karo
  if (fuelCompany && dieselInLitters > 0 && isStockManaged) {
    const fuelStock = await FuelStock.findOne({ fuelCompany });

    if (!fuelStock) {
      return next(new AppError("Fuel stock record nahi mila.", 404));
    }

    if (fuelStock.fuelLiters < dieselInLitters) {
      return next(new AppError(
        `Insufficient stock. Available: ${fuelStock.fuelLiters}L, Required: ${dieselInLitters}L`,
        400
      ));
    }
  }

  const entry = await EntryVehicle.create(validData);

  // Sirf managed company ka stock minus hoga
  if (fuelCompany && dieselInLitters > 0 && isStockManaged) {
    await FuelStock.findOneAndUpdate(
      { fuelCompany },
      { $inc: { fuelLiters: -dieselInLitters } }
    );
  }

  sendSuccessResponse(res, 201, logger, {
    message: "Vehicle entry created successfully.",
    doc: entry,
  });
});

// @route    GET /api/entry-vehicles
// exports.getAllEntryVehicles = catchAsync(async (req, res, next) => {
//   const { value: validQuery, error } = GETJoiEntryVehicleSchema.validate(req.query);
//   if (error) {
//     return next(new AppError(error.details[0].message, 400));
//   }
  
//   req.query = validQuery;
//   const query = {};

  

//   const populateOptions = [
//     { path: "client", select: "name" },
//     { path: "site", select: "siteName" },
//     { path: "vehicle", select: "vehicleNo" }
//   ];

//   handlerFactory.getAll(EntryVehicle, populateOptions, logger, query)(req, res, next);
// });
exports.getAllEntryVehicles = catchAsync(async (req, res, next) => {
  // 1. Joi validation checks parameters
  const { value: validQuery, error } = GETJoiEntryVehicleSchema.validate(req.query);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  
  req.query = validQuery;
  const query = {};

  

  // Base Populate options setup
  const populateOptions = [
    { path: "client", select: "name" },
    { path: "site", select: "siteName" },
    { path: "vehicle", select: "vehicleNo" },
    {path: 'fuelCompany',select:"fuelCompany"},
    {path:'payment.fuelCompany',select:"fuelCompany"}
  ];

  // Pass custom parsed target object logic inside factory template
  handlerFactory.getAll(EntryVehicle, populateOptions, logger, query,"date")(req, res, next);
});

// @route    GET /api/entry-vehicles/client/:clientId
exports.getEntriesByClient = catchAsync(async (req, res, next) => {

  // const { id } = req.params;

  // const entries = await EntryVehicle.find({ client: id })
  //   .populate("client","name phoneNumber city status")
  //   .populate("site", "siteName")
  //   .populate("vehicle", "vehicleNo typeVehicle")
  //   .sort({ date: -1 });

  // if (!entries || entries.length === 0) {
  //   return next(new AppError("No data records found for this designated client.", 404));
  // }

  // sendSuccessResponse(res, 200, logger, {
  //   message: "Client vehicle history record logs fetched successfully.",
  //   docs: entries
  // });

    const populateOptions = [
    { path: "client", select: "name phoneNumber city status" },
    { path: "site", select: "siteName" },
    { path: "vehicle", select: "vehicleNo  typeVehicle" },
  ];

  handlerFactory.getAllByField(EntryVehicle,"client",populateOptions,logger)(req, res, next)

});

exports.getEntriesByVehicle = catchAsync(async (req, res, next) => {
  // const { id } = req.params;

  // const entries = await EntryVehicle.find({ vehicle: id })
  //   .populate("site", "siteName")
  //   .populate("vehicle","vehicleNo ownerName status typeVehicle")
  //   .populate("client", "name")
  //   .sort({ date: -1 });

  // if (!entries || entries.length === 0) {
  //   return next(new AppError("No data records found for this designated client.", 404));
  // }
  

  // sendSuccessResponse(res, 200, logger, {
  //   message: "Vehicle  history record  fetched successfully.",
  //   docs: entries
  // });

  const populateOptions = [
    { path: "client", select: "name" },
    { path: "site", select: "siteName" },
    { path: "vehicle", select: "vehicleNo ownerName status typeVehicle" },
  ];

  handlerFactory.getAllByField(EntryVehicle,"vehicle",populateOptions,logger)(req, res, next)
});




exports.generateBill = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // 1. Find the vehicle entry
  const entry = await EntryVehicle.findById(id)
    .populate("client", "name")
    .populate("site", "siteName")
    .populate("vehicle", "vehicleNo");

  if (!entry) {
    return next(new AppError("No vehicle entry found with this ID.", 404));
  }

   // ✅ Empty string fix — ObjectId "" cast nahi hota
  if (!entry.payment.fuelCompany || entry.payment.fuelCompany === "") {
    entry.payment.fuelCompany = null;
  }
  // 2. Bill status ko 'generated' kar dein
  entry.billStatus = "generated";
  await entry.save(); // Pre-save fires automatically but won't alter states dangerously

  // 3. Poora document return karein taake frontend direct is details ko print format me use krly
  sendSuccessResponse(res, 200, logger, {
    message: "Bill generated successfully.",
    doc: entry
  });
});


exports.recordPayment = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // Frontend se Formik ka pure object req.body me received hoga
  const { paymentMethod, amount, checkNo, fuelCompany, fuelLiters, note } = req.body;

  // 1. Find Entry
  const entry = await EntryVehicle.findById(id);
  if (!entry) {
    return next(new AppError("No vehicle entry found with this ID to pay.", 404));
  }
  if (!entry.payment.fuelCompany || entry.payment.fuelCompany === "") {
    entry.payment.fuelCompany = null;
  }
  // 2. Map payload cleanly onto schema sub-object keys
  // Agar method badal raha hai ya pehle 'pending' tha, toh naya method set karein
  entry.payment.method = paymentMethod.toLowerCase(); 
  
  // Purani notes ke sath nayi note append (add) kar rahe hain taake history kharab na ho
  if (note) {
    entry.payment.note = entry.payment.note 
      ? `${entry.payment.note} | ${note}` 
      : note;
  }

  // Naya amount jo received hua hai
  const newAmount = Number(amount || 0);

  // 3. Increment (Add) amount instead of overwriting
  // Pehle se jo amount received ho chuki hai, usme naya amount plus kar rahe hain
  entry.payment.amountReceived = (entry.payment.amountReceived || 0) + newAmount;

  // Conditional setup based on method
  if (entry.payment.method === "check") {
    
    entry.payment.checkNo = checkNo || entry.payment.checkNo || "";
 } else if (entry.payment.method === "fuel") {
  const parsedLiters = Number(fuelLiters || 0);  // ✅ ek baar parse karo

  entry.payment.fuelLiters = (entry.payment.fuelLiters || 0) + parsedLiters;
  entry.payment.fuelCompany = fuelCompany || entry.payment.fuelCompany || null;

  if (fuelCompany && parsedLiters > 0) {
    const existingData = await FuelStock.findOne({ fuelCompany });
    if (existingData) {
      await FuelStock.findOneAndUpdate(
        { fuelCompany },
        { $inc: { fuelLiters: parsedLiters } }  // ✅
      );
    } else {
      await FuelStock.create({ 
        fuelCompany, 
        fuelLiters: parsedLiters   // ✅
      });
    }
  }
}

  // Yeh trigger hote hi aapka pre-save hook background me updated amountReceived (8000 + 7000 = 15000)
  // ko check karega aur clientDue ko 0 aur status ko "received" krdega!
  await entry.save();

  // Populate references for smooth receipt printing on client-side
  const updatedEntry = await EntryVehicle.findById(id)
    .populate("client", "name")
    .populate("site", "siteName")
    .populate("vehicle", "vehicleNo");

  sendSuccessResponse(res, 200, logger, {
    message: "Payment successfully updated onto client ledger.",
    doc: updatedEntry
  });
});




exports.getIncomeExpense = catchAsync(async (req, res, next) => {
  const { value: validQuery, error } = GETJoiEntryVehicleSchema.validate(req.query);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  req.query = validQuery;

  // Default specific fields — frontend override kar sakta hai
  if (!req.query.fields) {
    req.query.fields = "_id,date,vehicle, totalRate,remainingAmount";
  }

  handlerFactory.getAll(
    EntryVehicle,
    [
      { path: "vehicle", select: "vehicleNo typeVehicle" },
    ],
    logger,
    {}
  )(req, res, next);
});


exports.getIncomeSummary = catchAsync(async (req, res, next) => {
  const { value: validQuery, error } =
    GETJoiEntryVehicleSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  req.query = validQuery;

  const features = new APIFeatures(
    EntryVehicle.find(),
    req.query
  ).filter();

  const matchStage = features.queryObj || {};
  const mongoose = require('mongoose');
if (matchStage.vehicle) {
    matchStage.vehicle = new mongoose.Types.ObjectId(matchStage.vehicle);
}

  const result = await EntryVehicle.aggregate([
    {
      $match: matchStage,
    },
    {
      $group: {
        _id: null,

        totalRateSum: { $sum: "$totalRate" },
        remainingAmountSum: { $sum: "$remainingAmount" },
      },
    },
    {
      $project: {
        _id: 0,
        totalRateSum: 1,
        remainingAmountSum: 1,

        // expense calculation
        totalExpense: {
          $subtract: ["$totalRateSum", "$remainingAmountSum"],
        },

      },
    },
  ]);

  sendSuccessResponse(res,200,logger,{
    message:"total expense fetch successfully",
    docs:result[0] || {
      totalRateSum: 0,
      remainingAmountSum: 0,
      totalExpense: 0,
    },
  })

 
});



exports.dashboard = catchAsync(async(req,res,nex)=>{
  const { value: validQuery, error } =
    GETJoiEntryVehicleSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  req.query = validQuery;

  //   const features = new APIFeatures(
  //   EntryVehicle.find(),
  //   req.query
  // ).filter();

  const startOfMonth = new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  1
);

const startOfNextMonth = new Date(
  new Date().getFullYear(),
  new Date().getMonth() + 1,
  1
);

  // const matchStage = features.queryObj || {};

  const dashboard = await EntryVehicle.aggregate([
    {
      $match:{
        date: {
        $gte: startOfMonth,
        $lte: startOfNextMonth,
      },
      }
    },
    {
      $group:{
        _id:null,
        totalRates:{$sum:"$totalRate"},
        totalDue:{$sum:"$clientDue"},
        totalReceived:{$sum:"$payment.amountReceived"},
        cashReceived: {
        $sum: {
          $cond: [
            { $eq: ["$payment.method", "cash"] },
            "$payment.amountReceived",
            0,
          ],
        },
      },
      fuelReceived:{
        $sum:{
          $cond:[
            {$eq:["$payment.method","fuel"]},
            "$payment.amountReceived",
            0,
          ]
        }
      },
      checkReceived:{
        $sum:{
          $cond:[
            {$eq:["$payment.method","check"]},
            "$payment.amountReceived",
            0,
          ]
        }
      },
      other:{
        $sum:{
          $cond:[
            {$eq:["$payment.method","other"]},
            "$payment.amountReceived",
            0,
          ]
        }
      },
      
      }
    },
    {
      $project:{
        _id:0,
        totalRates:1,
        totalDue:1,
        totalReceived:1,
        cashReceived:1,
        checkReceived:1,
        fuelReceived:1,
        other:1
      }
    }
  ])

  sendSuccessResponse(res,200,logger,{
    docs:dashboard[0] || {
      totalRates:0,
        totalDue:0,
        totalReceived:0,
        cashReceived:0,
        checkReceived:0,
        fuelReceived:0,
        other:0
    }
  })

})
exports.todayDashboard = catchAsync(async(req,res,nex)=>{
  const { value: validQuery, error } =
    GETJoiEntryVehicleSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  req.query = validQuery;

    

const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);

const endOfDay = new Date();
endOfDay.setHours(23, 59, 59, 999);


  const dashboard = await EntryVehicle.aggregate([
    {
      $match:{
         date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      }
    },
    {
      $group:{
        _id:null,
        totalRates:{$sum:"$totalRate"},
        totalProfit:{$sum:"$remainingAmount"},
        totalReceived:{$sum:"$payment.amountReceived"},
        totalOrders:{$sum:1}
      
      }
    },
    {
      $project:{
        _id:0,
        totalRates:1,
        totalProfit:1,
        totalReceived:1,
        totalOrders:1,
      }
    }
  ])

  sendSuccessResponse(res,200,logger,{
    docs:dashboard[0] || {
      totalRates:0,
        totalProfit:0,
        totalReceived:0,
        totalOrders:0
    }
  })

})

exports.salesProfitChart = catchAsync(async (req, res, next) => {

  const { value: validQuery, error } =
    GETJoiEntryVehicleSchema.validate(req.query);

  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  req.query = validQuery;
  const year =  new Date().getFullYear();

  const startDate = new Date(year, 0, 1); // Jan 1
  const endDate = new Date(year + 1, 0, 1); // Next Jan 1

  const monthlyData = await EntryVehicle.aggregate([
    {
      $match: {
        date: {
          $gte: startDate,
          $lt: endDate,
        },
      },
    },
    {
      $group: {
        _id: {
          $month: "$date",
        },

        Revenue: {
          $sum: "$totalRate",
        },

        Profit: {
          $sum: "$remainingAmount",
        },
      },
    },
    {
      $sort: {
        "_id": 1,
      },
    },
  ]);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const chartData = months.map((month, index) => {
    const found = monthlyData.find(
      (item) => item._id === index + 1
    );

    return {
      month,
      Revenue: found?.Revenue || 0,
      Profit: found?.Profit || 0,
    };
  });

  sendSuccessResponse(res, 200, logger, {
    message:"sales chart fetched successfully",
    docs: chartData,
  });
});