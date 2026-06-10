const mongoose = require("mongoose");

const fuelSchema = new mongoose.Schema(
  {
    fuelCompany: {
      type: String,
      required: [true, "Fuel company name is required."],
      trim: true,
    },
    fuelLitters: {
      type: Number,
      required: [true, "Fuel volume in liters is required."],
      min: [0, "Fuel liters cannot be negative."],
    },
   
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

const Fuel = mongoose.model("Fuel", fuelSchema);
module.exports = Fuel;