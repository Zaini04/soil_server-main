const Joi = require("joi");
const {
  projectObjectId,
  sectorObjectId,
  inventoryType,
  plotNumber,
  number,
  fullNumber,
  street,
  approximateSize,
  significance,
  actualPrice,
  image,
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
  dataURI,
} = require("./baseJoiSchemas");

const inventoryStatus = status
  .valid("not_assigned", "assigned", "blocked", "deleted")
  .messages({
    "any.only": "Inventory status must be one of: not_assigned, assigned, blocked, deleted.",
  });

const POSTJoiSchema = Joi.object({
  project: projectObjectId.required(),
  sector: sectorObjectId.required(),
  type: inventoryType.required(),
  plotNumber: plotNumber.required(),
  number: number.required(),
  fullNumber: fullNumber.required(),
  street: street.required(),
  approximateSize: approximateSize.required(),
  significance: significance.required(),
  actualPrice: actualPrice.optional(),
  image: image.optional(),
});

const PATCHJoiSchema = Joi.object({
  project: projectObjectId.optional(),
  sector: sectorObjectId.optional(),
  type: inventoryType.optional(),
  plotNumber: plotNumber.optional(),
  number: number.optional(),
  fullNumber: fullNumber.optional(),
  street: street.optional(),
  approximateSize: approximateSize.optional(),
  significance: significance.optional(),
  actualPrice: actualPrice.optional(),
  image: image.optional(),
  status: inventoryStatus.optional(),
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
  status: inventoryStatus.optional(),
  autoIncrementId: autoIncrementId.optional(),
  project: projectObjectId.optional(),
  sector: sectorObjectId.optional(),
  type: inventoryType.optional(),
  plotNumber: plotNumber.optional(),
  number: number.optional(),
  fullNumber: fullNumber.optional(),
});

const CSVUploadJoiSchema = Joi.object({
  project: projectObjectId.required(),
  sector: sectorObjectId.required(),
  csvDataURI: dataURI.required(),
});

module.exports = { POSTJoiSchema, PATCHJoiSchema, GETJoiSchema, CSVUploadJoiSchema };
module.exports.inventoryValidationSchema = POSTJoiSchema;
