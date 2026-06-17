const mongoose = require("mongoose");

const fuelSchema = new mongoose.Schema(
  {
    vehicle: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Vehicle",
          required: [true, "Vehicle reference is required."],
        },
    fuelCompany: {
        type: mongoose.Schema.Types.ObjectId,
          ref: "FuelCompany",
          required: [true, "Fuel reference is required."],  
    },
    fuelLiters: {
      type: Number,
      required: [true, "Fuel volume in liters is required."],
      min: [0, "Fuel liters cannot be negative."],
    },
    TotalPrice:{
        type: Number,
        required: [true, "Fuel Total price is required."],
      min: [0, "Fuel TotalPrice cannot be negative."],
    }
   
  },
  {
    timestamps: true, 
  }
);

const Fuel = mongoose.model("Fuel", fuelSchema);
module.exports = Fuel;