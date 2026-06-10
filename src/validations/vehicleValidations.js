const Joi = require('joi');
const { vehicleNo, ownerName, typeVehicle, status, keyword, from, to, page, pageSize, sort, sortBy, fields, limit, autoIncrementId } = require('./baseJoiSchemas');

const userStatus = status.valid('Active', 'Inactive','Blocked',"Deleted").messages({
    'any.only': 'User status must be one of: Active, Inactive, Blocked and Deleted',
});

const POSTJoiVehicleSchema = Joi.object({
    vehicleNo: vehicleNo.required(),
    ownerName: ownerName.required(),
    typeVehicle: typeVehicle.required(),
    status:status.required()
});

const GETJoiVehicleSchema = Joi.object({
    keyword: Joi.string().optional().allow(""),
  from: Joi.date().optional(),
  to: Joi.date().optional(),
  page: Joi.number().optional(),
  pageSize: Joi.number().optional(),
  sort: Joi.string().optional(),
  sortBy: Joi.string().optional(),

  status: Joi.string().optional().allow(""),
  vehicleNo: Joi.string().optional().allow(""),
  ownerName: Joi.string().optional().allow(""),
  typeVehicle: Joi.string().optional().allow(""),
});

const PATCHJoiVehicleSchema = Joi.object({
  vehicleNo: vehicleNo.optional(),
  ownerName: ownerName.optional(),
  typeVehicle: typeVehicle.optional(),
  status: status.optional()
});
const vehicleValidation = POSTJoiVehicleSchema;

module.exports.vehicleValidation = vehicleValidation;
module.exports.POSTJoiVehicleSchema = POSTJoiVehicleSchema;
module.exports.GETJoiVehicleSchema = GETJoiVehicleSchema
module.exports.PATCHJoiVehicleSchema = PATCHJoiVehicleSchema
