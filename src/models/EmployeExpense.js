const mongoose = require("mongoose");

const EmployeeExpenseSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, "Employee reference is required"]
    },
    amount: {
        type: Number,   
        required: [true, "Expense amount is required"],
        min: [1, "Amount must be greater than 0"]
    },
    date: {
        type: Date,
        required: [true, "Expense date is required"],
        default: Date.now
    },
    notes: {
        type: String,
        default: ""
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

const EmployeeExpense = mongoose.model('EmployeeExpense', EmployeeExpenseSchema);
module.exports = EmployeeExpense;