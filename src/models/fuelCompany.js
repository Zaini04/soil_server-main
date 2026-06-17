const mongoose = require("mongoose");

const fuelCompanySchema = new mongoose.Schema(
  {
    fuelCompany: {
      type: String,
      required: [true, "Fuel company name is required."],
      trim: true,
      lowercase:true,
      unique:true
    },
   
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

const FuelCompany = mongoose.model("FuelCompany", fuelCompanySchema);
module.exports = FuelCompany;