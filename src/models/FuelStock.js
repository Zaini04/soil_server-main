const mongoose = require("mongoose");

const fuelStockSchema = new mongoose.Schema(
  {
    fuelCompany: {
      type: mongoose.Schema.Types.ObjectId,
      ref:'FuelCompany',
      required: [true, "Fuel company name is required."],
      
    },
    fuelLiters: {
      type: Number,
      required: [true, "Fuel volume in liters is required."],
      min: [0, "Fuel liters cannot be negative."],
    },
   
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

const FuelStock = mongoose.model("FuelStock", fuelStockSchema);
module.exports = FuelStock;