const Joi = require("joi");
const { keyword, from, to, page, pageSize, sort, sortBy, fields, limit } = require("./baseJoiSchemas");

const objectIdRegEx = /^[0-9a-fA-F]{24}$/;




const POSTJoiEmployeeExpenseSchema = Joi.object({
  date: Joi.date().required().messages({
    "date.base": "Please provide a valid date format.",
    "any.required": "Date field is required."
  }),
 
  employee:Joi.string().regex(objectIdRegEx).required().messages({
      "string.pattern.base": "Invalid Employee Reference ID.",
      "any.required": "Employee is required."
    }),
  notes: Joi.string().optional().allow(null,""),
 
  amount: Joi.number().min(0).required(),
 
});



const GETJoiEmployeeExpenseSchema = Joi.object({
  keyword: keyword.optional(),
  from: from.optional().allow(''),
  to: to.optional().allow(''),
  sort: sort.optional(),
  sortBy: sortBy.optional(),
  page: page.optional(),
  pageSize: pageSize.optional(),
  fields: fields.optional(),
  employee: Joi.string().optional().allow(''),
  status: Joi.string().optional().allow(""),
  name:Joi.string().optional().allow(''),
  date: Joi.string().optional().allow(""),
  // page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(10)
});




const EmployeeExpenseSchema = POSTJoiEmployeeExpenseSchema;

module.exports = {
  POSTJoiEmployeeExpenseSchema,
  GETJoiEmployeeExpenseSchema,
  EmployeeExpenseSchema
};