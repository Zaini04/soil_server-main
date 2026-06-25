const Client = require("../models/clientModel");
const AppError = require("../utils/appError");
const { sendSuccessResponse } = require("../utils/helpers");  
const { clientValidation, GETJoiClientSchema, PATCHJoiClientSchema } = require("../validations/clientValidations");
const catchAsync = require('../utils/catchAsync');
const logger = require("../logger")("Client_CONTROLLER");
const handlerFactory = require('./factories/handlerFactory');
const EntryVehicle = require("../models/entryVehicleModal");

exports.addClient = catchAsync(async (req, res, next) => {
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
            image 
        } = req.body;

        const { error } = clientValidation.validate(req.body);
        if (error) {
            return next(new AppError(error.details[0].message, 400));
        }

        const clientExists = await Client.findOne({ cnicOrNicop });
        if (clientExists) {
            return next(new AppError("Client with this CNIC/NICOP already exists.", 400));
        }

        await Client.create({
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
            image
        });

        return sendSuccessResponse(res, 201, logger, {
            message: "Client added successfully.",
        });

    } catch (error) {
        console.log("CREATE CLIENT ERROR:", error);
        return next(new AppError(error.message, 500));
    }
});

exports.getAllClients = catchAsync(async (req, res, next) => {
    const { value: validQuery, error } = GETJoiClientSchema.validate(req.query);
    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }
    req.query = validQuery;

    const query = {};
    handlerFactory.getAll(Client, '', logger, query)(req, res, next);
});

exports.updateClient = catchAsync(async (req, res, next) => {
  const { value: validData, error } = PATCHJoiClientSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  if (validData.cnicOrNicop) {
    const duplicateClient = await Client.findOne({
      cnicOrNicop: validData.cnicOrNicop,
      _id: { $ne: req.params.id }
    });
    if (duplicateClient) {
      return next(new AppError("This CNIC / NICOP number is already assigned to another client.", 400));
    }
  }

  req.body = validData;
  handlerFactory.updateOne(Client, logger)(req, res, next);
});

exports.deleteClient = handlerFactory.deleteOne(Client, logger);


exports.getClientDropdownList = async (req, res, next) => {
  try {
    const clients = await Client.find({ status: "Active" }) 
      .select("_id name")
      .lean();

  
     sendSuccessResponse(res,200,logger,{
      message:"clients dropdown list",
      docs:clients
    })
    
  } catch (error) {
        return next(new AppError(error.message, 500));
  }
};



exports.getClientSummary = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const entries = await EntryVehicle.find({ client: id });

  if (!entries || entries.length === 0) {
    return next(new AppError("No records found for this client.", 404));
  }

  const summary = entries.reduce((acc, entry) => {
    acc.totalRate += entry.totalRate || 0;
    acc.totalReceived += entry.payment?.amountReceived || 0;
    acc.totalDue += entry.clientDue || 0;
    acc.totalAdvance += entry.clientAdvance || 0;
    return acc;
  }, {
    totalRate: 0,
    totalReceived: 0,
    totalDue: 0,
    totalAdvance: 0,
  });

  sendSuccessResponse(res, 200, logger, {
    message: "Client summary fetched successfully.",
    summary,
  });
});


exports.getClient = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const doc =  await Client.findById(id).select('name image status phoneNumber city')

  if(!doc){
    return next(new AppError("No records found for this client.", 404));
  }

  sendSuccessResponse(res,200,logger,{
    message:"Client fetched successfully",
    doc:doc
  })

}
)
