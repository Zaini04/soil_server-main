const mongoose = require("mongoose");

const materialRateSchema = new mongoose.Schema({
  materialType: {
    type: String, 
    required: [true, "Material type is required."], // This holds "Soil", "Sand", etc.
    trim: true,
  },
  rateType: {
    type: String,
    required: [true, "Rate Type is required."],
    enum: {
      values: ["per sft", "per vehicle"],
      message: "Rate Type must be either: per sft or per vehicle",
    },
  },
  rate: {
    type: Number,
    required: [true, "Rate value is required."],
    min: [0, "Rate cannot be negative."],
  },
});

const siteSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "A site must be assigned to a client."],
    },
    siteName: { type: String, required: [true, "Site name is required."], trim: true },
    address: { type: String, required: [true, "Site address is required."], trim: true },
    image: { type: String, default: "" },
    
    // >>> EVERYTHING IS HERE NOW <<<
    materialsRates: [materialRateSchema], 
    
    status: { type: String, enum: ["Active", "Inactive","Blocked","Deleted"], default: "Active" },
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
  
  { timestamps: true }
);

const Site = mongoose.model("Site", siteSchema);
module.exports = Site;