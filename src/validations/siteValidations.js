const Joi = require("joi");
const { keyword, from, to, page, pageSize, sort, sortBy, fields, limit } = require("./baseJoiSchemas");

// Base field definitions
const client = Joi.string().hex().length(24).messages({
  "string.length": "Invalid Client ID reference format."
});
const siteName = Joi.string().trim().min(3).max(100).messages({
  "string.min": "Site name must be at least 3 characters long."
});
const address = Joi.string().trim().min(5).messages({
  "string.min": "Address details must be descriptive (min 5 chars)."
});
const image = Joi.string().allow("", null).optional();
const status = Joi.string().valid("Active", "Inactive").messages({
  "any.only": "Status must be either Active or Inactive."
});

// Nested Material Row Structure
const materialRateItemSchema = Joi.object({
  materialType: Joi.string().trim().required().messages({
    "string.empty": "Material type designation is required."
  }),
  rateType: Joi.string().valid("per sft", "per vehicle").required().messages({
    "any.only": "Rate Type must be either: 'per sft' or 'per vehicle'."
  }),
  rate: Joi.number().min(0).required().messages({
    "number.min": "Rate value cannot be a negative calculation amount."
  })
});

// --- Schemas exported for the Site Controller ---

// Used for POST /site/add_site
const POSTJoiSiteSchema = Joi.object({
  client: client.required(),
  siteName: siteName.required(),
  address: address.required(),
  image: image,
  materialsRates: Joi.array().items(materialRateItemSchema).min(1).required().messages({
    "array.min": "Please select and configure at least one material entry row."
  }),
  status: status.optional().default("Active")
});

// Used for PUT/PATCH /site/update_site/:id
const PATCHJoiSiteSchema = Joi.object({
  client: client.optional(),
  siteName: siteName.optional(),
  address: address.optional(),
  image: image,
  materialsRates: Joi.array().items(materialRateItemSchema).optional(),
  status: status.optional()
});

const GETJoiSiteSchema = Joi.object({
     keyword: keyword.optional(),
    from: from.optional().allow(''),
    to: to.optional().allow(''),
    page: page.optional(),
    pageSize: pageSize.optional(),
    sort: sort.optional(),
    sortBy: sortBy.optional(),
    fields: fields.optional(),
    limit: limit.optional(),
    name:Joi.string().optional().allow(''),
        date:Joi.string().optional().allow(""),
  client: Joi.string().optional().allow(''),
  siteName: Joi.string().optional().allow(""),
  address: address.optional(),
  image: image,
  materialsRates: Joi.array().items(materialRateItemSchema).optional(),
  status: Joi.string().optional().allow('')
});

const siteValidation = POSTJoiSiteSchema;

module.exports = {
  POSTJoiSiteSchema,
  PATCHJoiSiteSchema,
  GETJoiSiteSchema,
  siteValidation
};