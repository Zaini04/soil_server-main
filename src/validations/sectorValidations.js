const Joi = require('joi');
const {
    title,
    projectObjectId,
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

const sectorStatus = status.valid('active', 'deactivate', 'deleted').messages({
    'any.only': 'Sector status must be one of: active, deactivate, deleted.',
});

const POSTJoiSchema = Joi.object({
    title: title
        .required()
        .messages({
            'any.required': 'Sector title is required.',
            'string.base': 'Sector title be a string.',
        }),
    project: projectObjectId.required(),
});

const PATCHJoiSchema = Joi.object({
    title: title.optional(),
    project: projectObjectId.optional(),
    status: sectorStatus.optional(),
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
    status: sectorStatus.optional(),
    autoIncrementId: autoIncrementId.optional(),
    project: projectObjectId.optional(),
    title: title.optional(),
});

module.exports = POSTJoiSchema;
module.exports.POSTJoiSchema = POSTJoiSchema;
module.exports.PATCHJoiSchema = PATCHJoiSchema;
module.exports.GETJoiSchema = GETJoiSchema;
