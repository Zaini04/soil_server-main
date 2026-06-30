const mongoose = require("mongoose");

const pumpBillsSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, "Date is required."],
    },
    slipNo:{
        type:String,
        required: [true, " Bilty number is required"],
        unique:true
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle reference is required."],
    },
    fuelCompany: {
          type: mongoose.Schema.Types.ObjectId,
          ref:'FuelCompany',
          required: [true, "Fuel company name is required."],
          
        },
    todayDieselRate: {
      type: Number,
      required: [true, "Today diesel rate is required."],
      min: [0, "Rate cannot be negative."],
    },
     totalLiters: {
      type: Number,
      required: [true, "Fuel volume in liters is required."],
      min: [0, "Fuel liters cannot be negative."],
    },
    totalLoseOilLiters: {
      type: Number,
      min: [0, "Fuel liters cannot be negative."],
    },
    totalLoseOilAmount: {
      type: Number,
      default: 0, 
    },
    
    totalAmounts: {
      type: Number,
      required: [true, "Total rate calculation is required."],
      default: 0, 
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
},{
    timestamps: true, 
  })

  
  pumpBillsSchema.pre("save", function (next) {
  this.totalAmounts = (this.totalLiters * this.todayDieselRate) + totalLoseOilAmount;
  next()
  })

  pumpBillsSchema.index({
    date:-1,
  vehicle: 1,
});


  const PumpBills = mongoose.model("PumpBills", pumpBillsSchema);
  module.exports =PumpBills ;