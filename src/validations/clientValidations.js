const Joi = require('joi');
const { 
    email, 
    image, 
    status, 
    keyword, 
    from, 
    to, 
    page, 
    pageSize, 
    sort, 
    sortBy 
} = require('./baseJoiSchemas');

const clientStatus = status.valid('Active', 'Inactive','Blocked',"Deleted").messages({
    'any.only': 'Status must be either Active, Inactive ,Blocked and Deleted',
});

const clientName = Joi.string().trim().messages({
    "any.required": "Client name is required.",
    "string.empty": "Client name cannot be empty."
});

const fatherOrHusbandName = Joi.string().trim().messages({
    "any.required": "Father's / Husband's name is required.",
    "string.empty": "Father's / Husband's name cannot be empty."
});

const cnicOrNicop = Joi.string().trim().messages({
    "any.required": "CNIC / NICOP Number is required.",
    "string.empty": "CNIC / NICOP Number cannot be empty."
});

const phoneNumber = Joi.string().trim().messages({
    "any.required": "Phone number is required.",
    "string.empty": "Phone number cannot be empty."
});

const whatsAppNumber = Joi.string().trim().allow("").messages({
    "string.base": "WhatsApp number must be a string."
});

// Single string schema validation for standard address input
const address = Joi.string().trim().messages({
    "any.required": "Address is required.",
    "string.empty": "Address cannot be empty."
});

const city = Joi.string().trim().messages({
    "any.required": "City is required.",
    "string.empty": "Please select a valid city."
});

const state = Joi.string().trim().messages({
    "any.required": "State is required.",
    "string.empty": "Please select a valid state."
});

// POST Validation Schema
const POSTJoiClientSchema = Joi.object({
    image: image.optional().allow(""),
    name: clientName.required(),
    fatherOrHusbandName: fatherOrHusbandName.required(),
    cnicOrNicop: cnicOrNicop.required(),
    phoneNumber: phoneNumber.required(),
    whatsAppNumber: whatsAppNumber.optional(),
    email: email.required(),
    address: address.required(), // Flat property
    city: city.required(),
    state: state.required(),
    status: clientStatus.required()
});

const PATCHJoiClientSchema = Joi.object({
  name: clientName.optional(),
  fatherOrHusbandName: fatherOrHusbandName.optional(),
  cnicOrNicop: cnicOrNicop.optional(),
  phoneNumber: phoneNumber.optional(),
  whatsAppNumber: whatsAppNumber,
  email: email.optional(),
  address: address.optional(),
  city: city.optional(),
  state: state.optional(),
  status: clientStatus.optional(),
  image: Joi.string().optional().allow("")
});

// GET Filter Validation Schema
const GETJoiClientSchema = Joi.object({
    keyword: keyword.optional(),
    from: from.optional().allow(''),
    to: to.optional().allow(''),
    page: page.optional(),
    pageSize: pageSize.optional(),
    sort: sort.optional(),
    sortBy: sortBy.optional(),
    date:Joi.string().optional().allow(""),
    status: Joi.string().optional().allow(""),
    name: Joi.string().optional().allow(""),
    cnicOrNicop: Joi.string().optional().allow(""),
    phoneNumber: Joi.string().optional().allow(""),
    address: Joi.string().optional().allow(""),
    city: Joi.string().optional().allow(""),
    state: Joi.string().optional().allow("")
});

const clientValidation = POSTJoiClientSchema;

module.exports = {
    clientValidation,
    POSTJoiClientSchema,
    GETJoiClientSchema,
    PATCHJoiClientSchema
};