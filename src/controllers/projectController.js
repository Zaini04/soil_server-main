const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const logger = require('../logger')('PROJECT_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const { getNextInSequence } = require('../utils/db');
const { PREFIX_PROJECT_AUTOINCREMENTID } = require('../constants/app.constants');
const Project = require('../models/projectModel');
const {
    POSTJoiSchema,
    PATCHJoiSchema,
    GETJoiSchema,
} = require('../validations/projectValidations');

const popObj = [
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

    const checkProject = await Project.findOne({ title: validData.title });
    if (checkProject) {
      return next(new AppError('Project with this title already exists.', 400));
    }
    const project = await Project.create(validData);
      const newIDNumber = await getNextInSequence("projects");
  const longAutoIncrementId = getLongAutoIncrementId(
    PREFIX_PROJECT_AUTOINCREMENTID,
    newIDNumber,
  );
  project.autoIncrementId = newIDNumber;
  project.longAutoIncrementId = longAutoIncrementId;
  project.save();

    sendSuccessResponse(res , 200 , logger , {
        message: 'Project created successfully.' ,
        doc : project 
    });
});

exports.getAll = catchAsync(async(req , res , next) => {
    const { value: validQuery, error } = GETJoiSchema.validate(req.query);
    if(error) {
        return next(new AppError(error.details[0].message , 400))
    }

    req.query = validQuery;
    const query = {};

    if (validQuery.title) {
        query.title = validQuery.title;
    }
    if (validQuery.autoIncrementId !== undefined) {
        query.autoIncrementId = validQuery.autoIncrementId;
    }

    handlerFactory.getAll(Project  ,popObj, logger , query)(req , res , next)
});

exports.getSingle = handlerFactory.getOne(Project ,popObj, logger);
exports.update = catchAsync(async(req , res , next) => {
    const { value: validData, error } = PATCHJoiSchema.validate(req.body);
    if(error) {
        return next(new AppError(error.details[0].message , 400))
    }
    req.body = validData;
    handlerFactory.updateOne(Project , logger)(req , res , next)
});
exports.deleteProject = handlerFactory.deleteOne(Project , logger);

