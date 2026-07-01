const Joi = require("joi");

const fuelCompany = Joi.string().trim().min(2).max(100).messages({
  "string.empty": "Fuel company name cannot be empty.",
  "string.min": "Fuel company name must be at least 2 characters long."
});

const fuelLiters = Joi.number().positive().allow(0).messages({
  "number.base": "Fuel liters must be a valid numeric value.",
  "number.positive": "Fuel volume cannot be a negative value."
});







const POSTJoiFuelSchema = Joi.object({
  fuelCompany: fuelCompany.required(),
  fuelLiters: fuelLiters.required(),
});

const PATCHJoiFuelSchema = Joi.object({
  fuelCompany: fuelCompany.optional(),
  fuelLiters: fuelLiters.optional(),
});

const GETJoiFuelSchema = Joi.object({
    fuelCompany: Joi.string().optional().allow(""),
  fuelLiters: Joi.string().optional().allow(""),
    vehicleNo: Joi.string().optional().allow(""),
    vehicle: Joi.string().optional().allow(""),
  
    keyword: Joi.string().optional().allow(""),
    date:Joi.string().optional().allow(""),
    from: Joi.date().optional().allow(''),
    to: Joi.date().optional().allow(''),
    page: Joi.number().optional(),
    pageSize: Joi.number().optional(),
    sort: Joi.string().optional(),
    sortBy: Joi.string().optional(),
})


module.exports = {
  POSTJoiFuelSchema,
  PATCHJoiFuelSchema,
    GETJoiFuelSchema
};