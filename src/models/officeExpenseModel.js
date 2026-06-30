const mongoose = require("mongoose");

const officeExpenseSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, "Date is required."],
    },
    expenseType: {
            type: String,
            enum: ['Office', 'Site',],
            default: 'Office',
            required: [true, "Expense type is required"]
        },
     employeeName: {
        type: String,
        required: [true, "Employee name is required"]
    },
     amount: {
      type: Number,
      required: [true, "Amount is required."],
      default: 0, 
    },
    remarks: {
        type: String,
        default: "",
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
   
  },
  {
    timestamps: true, 
  }
);

const OfficeExpense = mongoose.model("OfficeExpense", officeExpenseSchema);
module.exports = OfficeExpense;