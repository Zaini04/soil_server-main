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

// --- UTILITY RESPONSE HELPER (Agar aapke pas global nahi hai to safe rehne k liye) ---

// @route    POST /api/entry-vehicles
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
  handlerFactory.getAll(EntryVehicle, populateOptions, logger, query)(req, res, next);
});

// @route    GET /api/entry-vehicles/client/:clientId
exports.getEntriesByClient = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const entries = await EntryVehicle.find({ client: id })
    .populate("client","name phoneNumber city status")
    .populate("site", "siteName")
    .populate("vehicle", "vehicleNo typeVehicle")
    .sort({ date: -1 });

  if (!entries || entries.length === 0) {
    return next(new AppError("No data records found for this designated client.", 404));
  }

  sendSuccessResponse(res, 200, logger, {
    message: "Client vehicle history record logs fetched successfully.",
    docs: entries
  });
});

exports.getEntriesByVehicle = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const entries = await EntryVehicle.find({ vehicle: id })
    .populate("site", "siteName")
    .populate("vehicle","vehicleNo owner Name status typeVehicle")
    .populate("client", "name")
    .sort({ date: -1 });

  if (!entries || entries.length === 0) {
    return next(new AppError("No data records found for this designated client.", 404));
  }

  sendSuccessResponse(res, 200, logger, {
    message: "Client vehicle history record logs fetched successfully.",
    docs: entries
  });
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
    req.query.fields = "_id,createdAt,vehicle, totalRate,remainingAmount";
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