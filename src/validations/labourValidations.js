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

const labourStatus = status.valid('Active', 'Inactive', 'Blocked', "Deleted").messages({
    'any.only': 'Status must be either Active, Inactive, Blocked and Deleted',
});

const labourName = Joi.string().trim().messages({
    "any.required": "Labour name is required.",
    "string.empty": "Labour name cannot be empty."
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

const POSTJoiLabourSchema = Joi.object({
    image: image.optional().allow(""),
    name: labourName.required(),
    fatherOrHusbandName: fatherOrHusbandName.required(),
    cnicOrNicop: cnicOrNicop.required(),
    phoneNumber: phoneNumber.required(),
    whatsAppNumber: whatsAppNumber.optional(),
    email: email.optional().allow(null, ''),
    address: address.required(),
    city: city.required(),
    state: state.required(),
    status: labourStatus.required(),
});

const PATCHJoiLabourSchema = Joi.object({
    name: labourName.optional(),
    fatherOrHusbandName: fatherOrHusbandName.optional(),
    cnicOrNicop: cnicOrNicop.optional(),
    phoneNumber: phoneNumber.optional(),
    whatsAppNumber: whatsAppNumber,
    email: email.optional().allow(null,''),
    address: address.optional(),
    city: city.optional(),
    state: state.optional(),
    status: labourStatus.optional(),
    image: Joi.string().optional().allow(""),
});

const GETJoiLabourSchema = Joi.object({
    keyword: keyword.optional(),
    from: from.optional().allow(''),
    to: to.optional().allow(''),
    page: page.optional(),
    pageSize: pageSize.optional(),
    sort: sort.optional(),
    sortBy: sortBy.optional(),
    date: Joi.string().optional().allow(""),
    status: Joi.string().optional().allow(""),
    name: Joi.string().optional().allow(""),
    cnicOrNicop: Joi.string().optional().allow(""),
    phoneNumber: Joi.string().optional().allow(""),
    address: Joi.string().optional().allow(""),
    city: Joi.string().optional().allow(""),
    state: Joi.string().optional().allow(""),
});

const LabourValidation = POSTJoiLabourSchema;

module.exports = {
    LabourValidation,
    POSTJoiLabourSchema,
    GETJoiLabourSchema,
    PATCHJoiLabourSchema
};