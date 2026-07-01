const Joi = require("joi");
const { keyword, from, to, page, pageSize, sort, sortBy, fields, limit } = require("./baseJoiSchemas");

const objectIdRegEx = /^[0-9a-fA-F]{24}$/;



const POSTJoiPumpBillsSchema = Joi.object({
  date: Joi.date().required().messages({
    "date.base": "Please provide a valid date format.",
    "any.required": "Date field is required."
  }),
  vehicle: Joi.string().regex(objectIdRegEx).required().messages({
    "string.pattern.base": "Invalid Vehicle Reference ID.",
    "any.required": "Vehicle selection is required."
  }),
  fuelCompany:Joi.string().trim().required().min(2).max(100).messages({
    "string.empty": "Fuel company name cannot be empty.",
    "string.min": "Fuel company name must be at least 2 characters long."
  }),
  slipNo: Joi.string().required().messages({
    "any.required": "Slip number is required."
  }),
  todayDieselRate: Joi.number().min(0).required(),
  totalLiters:Joi.number().required().positive().allow(0).messages({
    "number.base": "Fuel liters must be a valid numeric value.",
    "number.positive": "Fuel volume cannot be a negative value."
  }),

  totalLoseOilLiters:Joi.number().optional().positive().allow(null,0,''),
  totalLoseOilAmount: Joi.number().optional().allow(null,0,'').min(0).optional(), 
  totalAmounts: Joi.number().min(0).optional(), 

});




const GETJoiPumpBillsSchema = Joi.object({
  keyword: keyword.optional(),
  from: from.optional().allow(''),
  to: to.optional().allow(''),
  sort: sort.optional(),
  sortBy: sortBy.optional(),
  page: page.optional(),
  pageSize: pageSize.optional(),
  fields: fields.optional(),
  name: Joi.string().optional().allow(''),
  date: Joi.string().optional().allow(""),
  fuelCompany:Joi.string().optional().allow(''),
  site: Joi.string().optional().allow(''),
  vehicle: Joi.string().optional().allow(''),
  vehicleNo: Joi.string().optional().allow(""),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(10)
});

const entryPumpBillsSchema = POSTJoiPumpBillsSchema;

module.exports = {
  POSTJoiPumpBillsSchema,
  GETJoiPumpBillsSchema,
  entryPumpBillsSchema 
};