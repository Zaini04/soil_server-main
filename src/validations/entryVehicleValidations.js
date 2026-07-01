const Joi = require("joi");
const { keyword, from, to, page, pageSize, sort, sortBy, fields, limit } = require("./baseJoiSchemas");

const objectIdRegEx = /^[0-9a-fA-F]{24}$/;

const paymentJoiObject = Joi.object({
  method: Joi.string().valid("pending", "cash", "check", "fuel", "other").default("pending"),
  amountReceived: Joi.number().min(0).default(0),
  checkNo: Joi.string().allow("", null).default(""),
  fuelLiters: Joi.number().min(0).default(0),
  fuelCompany: Joi.string().allow("", null).default(null),
  note: Joi.string().allow("", null).default("")
});

const POSTJoiEntryVehicleSchema = Joi.object({
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
  rateType: Joi.string().valid("per sft", "per vehicle").required().messages({
    "any.only": "Rate Type must be either 'per sft' or 'per vehicle'."
  }),
  rate: Joi.number().min(0).required(),
  totalSftVehicles: Joi.number().min(0).required(),
  totalRate: Joi.number().min(0).optional(), 
  
  materialCost: Joi.number().min(0).default(0),
  dieselCost: Joi.number().min(0).default(0),
  dieselInLitters: Joi.number().min(0).default(0),
  fuelCompany: Joi.string().trim().regex(objectIdRegEx).required().messages({
    "string.pattern.base": "Invalid Fuel Company Reference ID.",
    "any.required": "Fuel Company selection is required."
  }),
  isStockManaged:Joi.boolean().default(false),
  driverExpense: Joi.number().min(0).default(0),
  loading: Joi.number().min(0).default(0),
  otherExpenses: Joi.number().empty("").optional().allow("",null).min(0).default(0),
  remainingAmount: Joi.number().optional(), 
  vendor: Joi.string().allow("", null),
  fuel: Joi.string().allow("", null),

  payment: paymentJoiObject.default(),
  clientDue: Joi.number().min(0).default(0),
  clientAdvance: Joi.number().min(0).default(0),
  
  paymentStatus: Joi.string().valid("pending", "partial", "received").default("pending"),
  billStatus: Joi.string().valid("generated", "pending").default("pending")
});

const PATCHJoiEntryVehicleSchema = Joi.object({
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
  rateType: Joi.string().valid("per sft", "per vehicle").required().messages({
    "any.only": "Rate Type must be either 'per sft' or 'per vehicle'."
  }),
  rate: Joi.number().min(0).required(),
  totalSftVehicles: Joi.number().min(0).required(),
  totalRate: Joi.number().min(0).optional(), 
  
  materialCost: Joi.number().min(0).default(0),
  dieselCost: Joi.number().min(0).default(0),
  dieselInLitters: Joi.number().min(0).default(0),
  fuelCompany: Joi.string().trim().regex(objectIdRegEx).required().messages({
    "string.pattern.base": "Invalid Fuel Company Reference ID.",
    "any.required": "Fuel Company selection is required."
  }),
  isStockManaged:Joi.boolean().default(false),
  driverExpense: Joi.number().min(0).default(0),
  loading: Joi.number().min(0).default(0),
  otherExpenses: Joi.number().empty("").optional().allow("",null).min(0).default(0),
  remainingAmount: Joi.number().optional(), 
  vendor: Joi.string().allow("", null),
  fuel: Joi.string().allow("", null),

  payment: paymentJoiObject.default(),
  clientDue: Joi.number().min(0).default(0),
  clientAdvance: Joi.number().min(0).default(0),
  
  paymentStatus: Joi.string().valid("pending", "partial", "received").default("pending"),
  billStatus: Joi.string().valid("generated", "pending").default("pending")
});


const GETJoiEntryVehicleSchema = Joi.object({
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
  site: Joi.string().regex(objectIdRegEx).optional(),
  vehicle: Joi.string().optional().allow(''),
  vehicleNo: Joi.string().optional().allow(""),
  paymentStatus: Joi.string().valid("pending", "partial", "received").optional(),
  billStatus: Joi.string().valid("generated", "pending").optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(10)
});

const entryVehicleValidation = POSTJoiEntryVehicleSchema;

module.exports = {
  POSTJoiEntryVehicleSchema,
  PATCHJoiEntryVehicleSchema,
  GETJoiEntryVehicleSchema,
  entryVehicleValidation
};