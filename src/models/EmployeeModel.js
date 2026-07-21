const { number } = require("joi");
const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
    image: {
        type: String,
        default: "" 
    },
    name: {
        type: String,
        required: [true, "Client name is required"],
        trim: true,
        lowercase: true,

    },
    fatherOrHusbandName: {
        type: String,
        required: [true, "Father's or Husband's name is required"],
        trim: true,
        lowercase: true,
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
    monthlySalary:{
        type:Number,
        required:[true,"monthlySalary is required"]
    },
    notes:{
        type:String,
        default:""
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

const Employee = mongoose.model('Employee', EmployeeSchema);
module.exports = Employee;