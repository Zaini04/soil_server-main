const Joi = require("joi");
const { keyword, from, to, page, pageSize, sort, sortBy, fields, limit } = require("./baseJoiSchemas");

const objectIdRegEx = /^[0-9a-fA-F]{24}$/;




const POSTJoiOfficeExpenseSchema = Joi.object({
  date: Joi.date().required().messages({
    "date.base": "Please provide a valid date format.",
    "any.required": "Date field is required."
  }),
 
  employeeName: Joi.string().required().messages({
    "any.required": "Employee name can not be empty."
  }),
  remarks: Joi.string().required().messages({
    "any.required": "amount is required."
  }),
 
  amount: Joi.number().min(0).required(),
 expenseType:Joi.string().required().messages({
    "any.required": "Expense Type can not be empty."
  }),
});



const GETJoiOfficeExpenseSchema = Joi.object({
  keyword: keyword.optional(),
  from: from.optional().allow(''),
  to: to.optional().allow(''),
  sort: sort.optional(),
  sortBy: sortBy.optional(),
  page: page.optional(),
  pageSize: pageSize.optional(),
  fields: fields.optional(),
  employeeName: Joi.string().optional().allow(''),
  expenseType: Joi.string().optional().allow(''),
  date: Joi.string().optional().allow(""),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(10)
});




const OfficeExpenseSchema = POSTJoiOfficeExpenseSchema;

module.exports = {
  POSTJoiOfficeExpenseSchema,
  GETJoiOfficeExpenseSchema,
  OfficeExpenseSchema
};