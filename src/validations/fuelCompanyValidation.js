const Joi = require("joi");

// Base field definitions
const fuelCompany = Joi.string().trim().min(2).max(100).messages({
  "string.empty": "Fuel company name cannot be empty.",
  "string.min": "Fuel company name must be at least 2 characters long."
});







// --- Schemas exported for the Fuel Controller ---

// Used for POST /fuel/add_fuel
const POSTJoiFuelCompanySchema = Joi.object({
  fuelCompany: fuelCompany.required(),
});

// Used for PUT/PATCH /fuel/update_fuel/:id
const PATCHJoiFuelCompanySchema = Joi.object({
  fuelCompany: fuelCompany.optional(),
});

const GETJoiFuelCompanySchema = Joi.object({
    fuelCompany: Joi.string().optional().allow(""),
    keyword: Joi.string().optional().allow(""),
    from: Joi.date().optional().allow(''),
    to: Joi.date().optional().allow(''),
    page: Joi.number().optional(),
    pageSize: Joi.number().optional(),
    sort: Joi.string().optional(),
    sortBy: Joi.string().optional(),
})


module.exports = {
  POSTJoiFuelCompanySchema,
  PATCHJoiFuelCompanySchema,
    GETJoiFuelCompanySchema
};