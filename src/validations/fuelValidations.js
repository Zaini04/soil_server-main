const Joi = require("joi");

// Base field definitions
const fuelCompany = Joi.string().trim().min(2).max(100).messages({
  "string.empty": "Fuel company name cannot be empty.",
  "string.min": "Fuel company name must be at least 2 characters long."
});

const fuelLiters = Joi.number().positive().allow(0).messages({
  "number.base": "Fuel liters must be a valid numeric value.",
  "number.positive": "Fuel volume cannot be a negative value."
});



// --- Schemas exported for the Fuel Controller ---

// Used for POST /fuel/add_fuel
const POSTJoiFuelSchema = Joi.object({
  fuelCompany: fuelCompany.required(),
  fuelLiters: fuelLiters.required(),
});

// Used for PUT/PATCH /fuel/update_fuel/:id
const PATCHJoiFuelSchema = Joi.object({
  fuelCompany: fuelCompany.optional(),
  fuelLiters: fuelLiters.optional(),
});

const GETJoiFuelSchema = Joi.object({
    fuelCompany: fuelCompany.optional(),
  fuelLiters: fuelLiters.optional(),
    keyword: Joi.string().optional().allow(""),
    from: Joi.date().optional(),
    to: Joi.date().optional(),
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