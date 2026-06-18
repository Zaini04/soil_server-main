const Joi = require('joi');
const {
    username,
    email,
    password,
    status,
    keyword,
    from,
    to,
    page,
    pageSize,
    sort,
    sortBy,
    fields,
    limit,
    autoIncrementId,
    objectId,
    country,
    gender,
    dateOfBirth,
} = require("./baseJoiSchemas");

const userStatus = status.valid('Active', 'Blocked', 'Deleted').messages({
    'any.only': 'User status must be one of: Active, Blocked and Deleted.',
});

const role = objectId.messages({
    'any.required': 'Role ID is required.',
    'string.empty': 'Role ID cannot be empty.',
});

const POSTJoiSchema = Joi.object({
    username: username.required(),
    email: email.required(),
    password: password.required(),
    role:role.required()
});

const PATCHJoiSchema = Joi.object({
    username: username.optional(),
    email: email.optional(),
    password: password.optional(),
    role: role.allow(null).optional(),
    country: country.optional(),
    gender: gender.optional(),
    dateOfBirth: dateOfBirth.optional(),
    status: userStatus.optional(),
});

const GETJoiSchema = Joi.object({
    keyword: keyword.optional(),
    from: from.optional(),
    to: to.optional(),
    page: page.optional(),
    pageSize: pageSize.optional(),
    sort: sort.optional(),
    sortBy: sortBy.optional(),
    fields: fields.optional(),
    limit: limit.optional(),
    status: userStatus.optional(),
    autoIncrementId: autoIncrementId.optional(),
    role: role.allow(null).optional(),
    email: email.optional(),
    username: username.optional(),
});

const userValidation = POSTJoiSchema;

module.exports = userValidation;
module.exports.POSTJoiSchema = POSTJoiSchema;
module.exports.PATCHJoiSchema = PATCHJoiSchema;
module.exports.GETJoiSchema = GETJoiSchema;
