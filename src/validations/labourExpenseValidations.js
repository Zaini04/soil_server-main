const Joi = require('joi');
const {
    keyword,
    from,
    to,
    page,
    pageSize,
    sort,
    sortBy
} = require('./baseJoiSchemas');

const amount = Joi.number().min(1).messages({
    "any.required": "Amount is required.",
    "number.min": "Amount must be greater than 0."
});

const date = Joi.date().messages({
    "any.required": "Date is required."
});

const notes = Joi.string().trim().allow("").messages({
    "string.base": "Notes must be a string."
});

const POSTJoiLabourExpenseSchema = Joi.object({
    labour: Joi.string().required().messages({
        "any.required": "Labour is required.",
        "string.empty": "Labour cannot be empty."
    }),
    amount: amount.required(),
    date: date.optional(),
    notes: notes.optional(),
});

const GETJoiLabourExpenseSchema = Joi.object({
    keyword: keyword.optional(),
    from: from.optional().allow(''),
    to: to.optional().allow(''),
    sort: sort.optional(),
    sortBy: sortBy.optional(),
    page: page.optional(),
    pageSize: pageSize.optional(),
    labour: Joi.string().optional().allow(''),
    date: Joi.string().optional().allow(""),
});

module.exports = {
    POSTJoiLabourExpenseSchema,
    GETJoiLabourExpenseSchema
};