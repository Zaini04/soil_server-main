const Joi = require('joi');

const RoleValidation = Joi.object({
    name: Joi.string().required(),
    permissions: Joi.array().items(
        Joi.object({
            menu:Joi.string().required(),
            actions:Joi.object({
                view: Joi.boolean().default(false),
                create: Joi.boolean().default(false),
                update: Joi.boolean().default(false),
                delete: Joi.boolean().default(false),
            }).required()
        })
    ).required()
})

module.exports.RoleValidation = RoleValidation