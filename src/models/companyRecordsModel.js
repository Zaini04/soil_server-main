const mongoose = require("mongoose");

const companyRecordsSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, "Date is required."],
    },
    biltyNo:{
        type:String,
        required: [true, " Bilty number is required"],
        unique:true
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle reference is required."],
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client reference is required."],
    },
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      required: [true, "Site reference is required."],
    },
     materialType: {
      type: String,
      required: [true, "Material type is required."],
    },
    rate: {
      type: Number,
      required: [true, "Rate is required."],
      min: [0, "Rate cannot be negative."],
    },
    totalSft: {
      type: Number,
      required: [true, "Total Sft  is required."],
      min: [0, "Sft amount cannot be negative."],
    },
    totalRate: {
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

  
  companyRecordsSchema.pre("save", function (next) {
  // 1. Total  Rate Calculation
  this.totalRate = this.totalSft * this.rate;
  next()
  })

  companyRecordsSchema.index({
    date:-1,
  client: 1,
  site: 1,
});


  const CompanyRecords = mongoose.model("CompanyRecords", companyRecordsSchema);
  module.exports =CompanyRecords ;