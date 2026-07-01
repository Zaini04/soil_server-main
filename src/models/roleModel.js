const mongoose = require('mongoose');
const { type } = require('../validations/userValidations');

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  permissions: [
    {
        menu: { 
            type: String, 
            required: true 
        }, 
        actions:{
          view: {type: Boolean,default: false},
          create: { type: Boolean, default: false },
          update: { type: Boolean, default: false },
          delete: { type: Boolean, default: false },
        }
    },
  ],
}, { timestamps: true });

const Role = mongoose.model('Role', RoleSchema);
module.exports = Role;