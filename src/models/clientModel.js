const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema({
    image: {
        type: String,
        default: "" 
    },
    name: {
        type: String,
        required: [true, "Client name is required"]
    },
    fatherOrHusbandName: {
        type: String,
        required: [true, "Father's or Husband's name is required"]
    },
    cnicOrNicop: {
        type: String,
        unique: true,
        required: [true, "CNIC / NICOP number is required"]
    },
    phoneNumber: {
        type: String,
        required: [true, "Phone number is required"]
    },
    whatsAppNumber: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        required: [true, "Email address is required"]
    },
    // Flattened directly into a single string field
    address: {
        type: String,
        required: [true, "Address is required"]
    },
    city: {
        type: String,
        required: [true, "City selection is required"]
    },
    state: {
        type: String,
        required: [true, "State selection is required"]
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive','Blocked',"Deleted"],
        default: 'Active',
        required: [true, "Status is required"]
    },
     createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' 
      }
}, { timestamps: true });

const Client = mongoose.model('Client', ClientSchema);
module.exports = Client;