const Joi = require("joi");
const { INVENTORY_TYPES } = require("../constants/app.constants");

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
  "string.base": "ObjectId must be a string.",
  "string.empty": "ObjectId cannot be empty.",
  "string.pattern.base": "ObjectId must be a valid MongoDB ObjectId.",
});

const arrObjectId = Joi.array().items(objectId).messages({
  "array.base": "ObjectIds should be an array.",
});

const userObjectId = objectId.messages({
  "any.required": "User ID is required.",
  "string.empty": "User ID cannot be empty.",
});

const projectObjectId = objectId.messages({
  "any.required": "Project ID is required.",
  "string.empty": "Project ID cannot be empty.",
});

const sectorObjectId = objectId.messages({
  "any.required": "Sector ID is required.",
  "string.empty": "Sector ID cannot be empty.",
});

const title = Joi.string().trim().messages({
  "any.required": "Title is required.",
  "string.base": "Title must be a string.",
  "string.empty": "Title cannot be empty.",
});

const username = Joi.string()
  .trim()
  .pattern(/^[a-zA-Z0-9._-]{3,30}$/)
  .messages({
    "any.required": "Username is required.",
    "string.empty": "Username cannot be empty.",
    "string.pattern.base":
      "Username must be 3-30 characters long and can only contain letters, numbers, dots, underscores, or dashes.",
  });

const email = Joi.string().trim().email().messages({
  "any.required": "Email is required.",
  "string.empty": "Email cannot be empty.",
  "string.email": "Email must be a valid email address.",
});

const password = Joi.string().min(6).messages({
  "any.required": "Password is required.",
  "string.empty": "Password cannot be empty.",
  "string.min": "Password should be a minimum of 6 characters.",
});

const country = Joi.string().trim().messages({
  "string.empty": "Country cannot be empty.",
});

const gender = Joi.string().valid("male", "female", "other").messages({
  "string.empty": "Gender cannot be empty.",
  "any.only": "Gender must be one of: male, female, other.",
});

const dateOfBirth = Joi.string().messages({
  "string.empty": "Date of birth cannot be empty.",
});

const dataURI = Joi.string().dataUri().messages({
  "any.required": "File is required.",
  "string.empty": "File cannot be empty.",
  "string.dataUri": "File must be a valid data URI.",
});

const from = Joi.date().iso().messages({
  "date.base": "Invalid date.",
  "date.format": "Invalid date format.",
  "any.required": "From date is required.",
});

const to = Joi.date().iso().greater(Joi.ref("from")).messages({
  "date.base": "Invalid date.",
  "date.format": "Invalid date format.",
  "date.greater": "To date should be later than from date.",
  "any.required": "To date is required.",
});

const page = Joi.number().integer().min(1).messages({
  "number.base": "Page should be a number.",
  "number.integer": "Page should be an integer.",
  "number.min": "Page should be at least 1.",
});

const pageSize = Joi.number().integer().min(1).messages({
  "number.base": "Page size should be a number.",
  "number.integer": "Page size should be an integer.",
  "number.min": "Page size should be at least 1.",
});

const keyword = Joi.string().trim().allow("").messages({
  "string.base": "Keyword must be a string.",
});

const sortBy = Joi.string().trim().messages({
  "string.empty": "sortBy cannot be empty.",
});

const sort = Joi.string().trim().messages({
  "string.empty": "Sort cannot be empty.",
});

const fields = Joi.string().trim().messages({
  "string.empty": "Fields cannot be empty.",
});

const limit = Joi.number().integer().min(1).messages({
  "number.base": "Limit should be a number.",
  "number.integer": "Limit should be an integer.",
  "number.min": "Limit should be at least 1.",
});

const autoIncrementId = Joi.number().integer().min(0).messages({
  "number.base": "AutoIncrementId should be a number.",
  "number.integer": "AutoIncrementId should be an integer.",
  "number.min": "AutoIncrementId cannot be negative.",
  "any.required": "AutoIncrementId is required.",
});

const status = Joi.string().trim().messages({
  "any.required": "Status is required.",
  "string.empty": "Status cannot be empty.",
});

const inventoryType = Joi.string()
  .valid(...INVENTORY_TYPES)
  .messages({
    "any.required": "Inventory type is required.",
    "string.base": "Inventory type must be a string.",
    "string.empty": "Inventory type cannot be empty.",
    "any.only": `Inventory type must be one of: ${INVENTORY_TYPES.join(", ")}.`,
  });

const plotNumber = Joi.string().trim().messages({
  "any.required": "Plot number is required.",
  "string.base": "Plot number must be a string.",
  "string.empty": "Plot number cannot be empty.",
});

const number = Joi.string().trim().messages({
  "any.required": "Number is required.",
  "string.base": "Number must be a string.",
  "string.empty": "Number cannot be empty.",
});

const fullNumber = Joi.string().trim().messages({
  "any.required": "Full number is required.",
  "string.base": "Full number must be a string.",
  "string.empty": "Full number cannot be empty.",
});

const street = Joi.string().trim().messages({
  "any.required": "Street is required.",
  "string.base": "Street must be a string.",
  "string.empty": "Street cannot be empty.",
});

const approximateSize = Joi.string().trim().messages({
  "any.required": "Approximate size is required.",
  "string.base": "Approximate size must be a string.",
  "string.empty": "Approximate size cannot be empty.",
});

const significance = Joi.string().trim().messages({
  "any.required": "Significance is required.",
  "string.base": "Significance must be a string.",
  "string.empty": "Significance cannot be empty.",
});

const actualPrice = Joi.number().min(0).messages({
  "number.base": "Actual price must be a number.",
  "number.min": "Actual price cannot be negative.",
});

const image = Joi.string().trim().messages({
  "string.base": "Image must be a string.",
});

const countryCode = Joi.string().trim().min(2).max(2).messages({
  "any.required": "Country code is required.",
  "string.empty": "Country code cannot be empty.",
  "string.min": "Country code must be 2 characters.",
  "string.max": "Country code must be 2 characters.",
});

const body = Joi.string().trim().messages({
  "any.required": "Body is required.",
  "string.empty": "Body cannot be empty.",
});

const vehicleNo = Joi.string().pattern(/^[a-zA-Z0-9]{3,30}$/).trim().messages({
  "any.required": "Vehicle number is required.",
  "string.base": "Vehicle number must be a string.",
  "string.empty": "Vehicle number cannot be empty.",
  "string.pattern.base":
      "Vehicle No must be 3-30 characters long and can only contain letters and numbers.",

});

const ownerName = Joi.string()
  .trim()
  .messages({
    "any.required": "Owner name is required.",
    "string.empty": "Owner name cannot be empty.",
    "string.pattern.base":
      "Ownern ame must be 3-30 characters long and can only contain letters, underscores, or dashes.",
  });

const typeVehicle = Joi.string()
  .trim()
  .messages({
    "any.required": "Vehicle type is required.",
    "string.empty": "Vehicle type cannot be empty.",

  });


 


module.exports = {
  objectId,
  arrObjectId,
  userObjectId,
  projectObjectId,
  sectorObjectId,
  title,
  vehicleNo,
  ownerName,
  typeVehicle,
  username,
  email,
  password,
  country,
  gender,
  dateOfBirth,
  dataURI,
  from,
  to,
  page,
  pageSize,
  keyword,
  sortBy,
  sort,
  fields,
  limit,
  autoIncrementId,
  status,
  inventoryType,
  plotNumber,
  number,
  fullNumber,
  street,
  approximateSize,
  significance,
  actualPrice,
  image,
  countryCode,
  body,
};
