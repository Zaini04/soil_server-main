const catchAsync = require("../utils/catchAsync");
const {
  sendSuccessResponse,
  sendErrorResponse,
  getLongAutoIncrementId,
} = require("../utils/helpers");
const AppError = require("../utils/appError");
const logger = require('../logger')('INVENTORY_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const {
  POSTJoiSchema,
  PATCHJoiSchema,
  GETJoiSchema,
  CSVUploadJoiSchema,
} = require("../validations/inventoryValidation");
const Inventory = require("../models/inventoryModel");
const { getNextInSequence } = require("../utils/db");
const { PREFIX_INVENTORY_AUTOINCREMENTID, NUMBERS_DIR } = require("../constants/app.constants");
const Project = require("../models/projectModel");
const Sector = require("../models/sectorModel");
const { uploadDataFile } = require("../utils/uploadFiles");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");

const popItems = [
  { path: 'project', select: 'title' },
  { path: 'sector', select: 'title' },
  { path: 'createdBy', select: 'username image email -_id' },
];

exports.createInventory = catchAsync(async (req, res, next) => {
  const { value: validData, error } = POSTJoiSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  validData.createdBy = req.user._id;
  const inventory = await Inventory.create(validData);

  const newIDNumber = await getNextInSequence("inventories");
  inventory.autoIncrementId = newIDNumber;
  inventory.longAutoIncrementId = getLongAutoIncrementId(
    PREFIX_INVENTORY_AUTOINCREMENTID,
    newIDNumber
  );
  await inventory.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Inventory created successfully.',
    doc: inventory,
  });
});

exports.getAllInventories = catchAsync(async (req, res, next) => {
  const { value: validQuery, error } = GETJoiSchema.validate(req.query);
  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const { project, sector, type, status } = validQuery;
  req.query = validQuery;
  const query = {};

  if (project) {
    query.project = project;
  } else if (sector) {
    query.sector = sector;
  } else if (type) {
    query.type = type;
  } else if (status) {
    query.status = status;
  }

  handlerFactory.getAll(Inventory, popItems, logger, query)(req, res, next);
});

exports.createCSVUploadOfInventory = catchAsync(async (req, res, next) => {
  const { value: validData, error } = CSVUploadJoiSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const existingProject = await Project.findById(validData.project);

  if (!existingProject) {
    return sendErrorResponse(res, 422, logger, {
      message: "Project not found!",
    });
  }

  const existingSector = await Sector.findById(validData.sector);
  if (!existingSector) {
    return sendErrorResponse(res, 422, logger, {
      message: "Sector not found!",
    });
  }

  const base64String = validData.csvDataURI.split(",")[1];
  let fileNameOnServerDisk;

  try {
    fileNameOnServerDisk = await uploadDataFile(
      base64String,
      NUMBERS_DIR,
      ".csv",
    );
  } catch (err) {
    console.error(err);
    return sendErrorResponse(res, 500, logger, {
      message: "File upload failed",
      doc: null,
    });
  }

  const filePath = path.join(
    __dirname,
    "../uploads",
    NUMBERS_DIR,
    fileNameOnServerDisk,
  );

  const results = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        const insertMany = [];

        for (const el of results) {
          const newIDNumber = await getNextInSequence("inventories");
          const longAutoIncrementId = getLongAutoIncrementId(
            PREFIX_INVENTORY_AUTOINCREMENTID,
            newIDNumber
          );

          insertMany.push({
            autoIncrementId: newIDNumber,
            longAutoIncrementId,
            project: existingProject._id,
            sector: existingSector._id,
            createdBy: req.user._id,
            ...el,
          });
        }

        try {
          console.info(`About to create inventories: ${insertMany.length}`);
          await Inventory.insertMany(insertMany);

          sendSuccessResponse(res, 201, logger, {
            doc: {
              message: "Inventory creation in progress! Please wait...",
            },
          });
        } catch (err) {
          console.error(err);
          logger.error(err.message);
          return sendErrorResponse(res, 500, logger, {
            message: "Database create operation failed!",
          });
        }
      } catch (err) {
        console.error(err);
        logger.error(err.message);
        const msg =
          process.env.NODE_ENV === "development"
            ? err.message
            : "Unknown error occurred! Possible error: Wrong header row";
        return sendErrorResponse(res, 500, logger, {
          message: msg,
        });
      }
    });
});

exports.getSingle = handlerFactory.getOne(Inventory, popItems, logger);
exports.update = catchAsync(async(req , res , next) => {
  const { value: validData, error } = PATCHJoiSchema.validate(req.body);
  if(error) {
    return next(new AppError(error.details[0].message , 422))
  }
  req.body = validData;
  handlerFactory.updateOne(Inventory , logger)(req , res , next)
});
exports.deleteInventory = handlerFactory.deleteOne(Inventory, logger);
