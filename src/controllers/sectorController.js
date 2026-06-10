const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const logger = require('../logger')('PROJECT_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const { getNextInSequence } = require('../utils/db');
const { PREFIX_SECTOR_AUTOINCREMENTID } = require('../constants/app.constants');
const {
    POSTJoiSchema,
    PATCHJoiSchema,
    GETJoiSchema,
} = require('../validations/sectorValidations');
const Sector = require('../models/sectorModel');

const popObj = [
    {
        path : 'project',
        select: 'title -_id longAutoIncrementId'
    },
    {
        path : 'createdBy',
        select: 'username image email -_id'}

]

exports.create = catchAsync(async(req , res , next) => {
    const { value: validData, error } = POSTJoiSchema.validate(req.body);
    if(error) {
        return next(new AppError(error.details[0].message , 400))
    }
    const createdBy = req.user._id;
    validData.createdBy = createdBy;

        const checkSector = await Sector.findOne({ title: validData.title, project: validData.project });
        if (checkSector) {
          return next(new AppError('This sector already exists in this project.', 400));
        }

    const sector = await Sector.create(validData);
      const newIDNumber = await getNextInSequence("sectors");
  const longAutoIncrementId = getLongAutoIncrementId(
    PREFIX_SECTOR_AUTOINCREMENTID,
    newIDNumber,
  );
  sector.autoIncrementId = newIDNumber;
  sector.longAutoIncrementId = longAutoIncrementId;
  sector.save();

    sendSuccessResponse(res , 200 , logger , {
        message: 'Sector created successfully.' ,
        doc : sector 
    });
});

exports.getAll = catchAsync(async(req , res , next) => {
    const { value: validQuery, error } = GETJoiSchema.validate(req.query);
    if(error) {
        return next(new AppError(error.details[0].message , 400))
    }

    req.query = validQuery;
    const { project } = validQuery;
    const query = {};

    if (project) {
      query.project = project;
    } 
    handlerFactory.getAll(Sector  ,popObj, logger , query)(req , res , next)
});

exports.getSingle = handlerFactory.getOne(Sector , popObj,  logger);
exports.update = catchAsync(async(req , res , next) => {
    const { value: validData, error } = PATCHJoiSchema.validate(req.body);
    if(error) {
        return next(new AppError(error.details[0].message , 400))
    }
    req.body = validData;
    handlerFactory.updateOne(Sector , logger)(req , res , next)
});
exports.deleteSector = handlerFactory.deleteOne(Sector , logger);

