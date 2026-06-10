const Joi = require('joi');
const {
    title,
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
} = require("./baseJoiSchemas");

const projectStatus = status.valid('active', 'deactivate', 'deleted').messages({
    'any.only': 'Project status must be one of: active, deactivate, deleted.',
});

const POSTJoiSchema = Joi.object({
    title: title
        .required()
        .messages({
            'any.required': 'Project title is required.',
            'string.base': 'Project title be a string.',
        }),



});

const PATCHJoiSchema = Joi.object({
    title: title.optional(),
    status: projectStatus.optional(),
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
    status: projectStatus.optional(),
    autoIncrementId: autoIncrementId.optional(),
    title: title.optional(),
});

module.exports = POSTJoiSchema;
module.exports.POSTJoiSchema = POSTJoiSchema;
module.exports.PATCHJoiSchema = PATCHJoiSchema;
module.exports.GETJoiSchema = GETJoiSchema;
