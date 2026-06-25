const Joi = require("joi");
const { keyword, from, to, page, pageSize, sort, sortBy, fields, limit } = require("./baseJoiSchemas");

// Helper regex to ensure hex MongoDB ObjectId string validation
const objectIdRegEx = /^[0-9a-fA-F]{24}$/;

// --- NESTED PAYMENT SCHEMAS FOR REUSABILITY ---


const POSTJoiCompanyRecordsSchema = Joi.object({
  date: Joi.date().required().messages({
    "date.base": "Please provide a valid date format.",
    "any.required": "Date field is required."
  }),
  client: Joi.string().regex(objectIdRegEx).required().messages({
    "string.pattern.base": "Invalid Client Reference ID.",
    "any.required": "Client selection is required."
  }),
  site: Joi.string().regex(objectIdRegEx).required().messages({
    "string.pattern.base": "Invalid Site Reference ID.",
    "any.required": "Site selection is required."
  }),
  vehicle: Joi.string().regex(objectIdRegEx).required().messages({
    "string.pattern.base": "Invalid Vehicle Reference ID.",
    "any.required": "Vehicle selection is required."
  }),
  materialType: Joi.string().required().messages({
    "any.required": "Material selection cannot be blank."
  }),
  biltyNo: Joi.string().required().messages({
    "any.required": "Bilty number is required."
  }),
 
  rate: Joi.number().min(0).required(),
  totalSft: Joi.number().min(0).required(),
  totalRate: Joi.number().min(0).optional(), 

});



const GETJoiCompanyRecordsSchema = Joi.object({
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
  searchdate: Joi.string().optional().allow(""),
  client: Joi.string().optional().allow(''),
  clientName: Joi.string().optional().allow(''),
  fuelCompany:Joi.string().optional().allow(''),
  site: Joi.string().optional().allow(''),
  vehicle: Joi.string().optional().allow(''),
  vehicleNo: Joi.string().optional().allow(""),
    siteName: Joi.string().optional().allow(""),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(10)
});

const entryCompanyRecordsSchema = POSTJoiCompanyRecordsSchema;

module.exports = {
  POSTJoiCompanyRecordsSchema,
  GETJoiCompanyRecordsSchema,
  entryCompanyRecordsSchema
};