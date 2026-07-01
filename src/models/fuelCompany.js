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

const FuelCompany = mongoose.model("FuelCompany", fuelCompanySchema);
module.exports = FuelCompany;