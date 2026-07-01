const mongoose = require("mongoose");

const vehicleEntrySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, "Date is required."],
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
    rateType: {
      type: String,
      required: [true, "Rate type is required."],
      enum: ["per sft", "per vehicle"],
    },
    rate: {
      type: Number,
      required: [true, "Rate is required."],
      min: [0, "Rate cannot be negative."],
    },
    totalSftVehicles: {
      type: Number,
      required: [true, "Total Sft or Vehicles amount is required."],
      min: [0, "Amount cannot be negative."],
    },
    totalRate: {
      type: Number,
      required: [true, "Total rate calculation is required."],
      default: 0, 
    },

    materialCost: {
      type: Number,
      required: [true, "Material cost is required."],
      default: 0,
    },
   fuelCompany: {
    type:mongoose.Schema.Types.ObjectId,
    ref:'FuelCompany',
    required: [true,"FuelCompany is required"]
    },
    dieselCost: {
      type: Number,
      required: [true, "Diesel expense is required."],
      default: 0,
    },
    dieselInLitters: {
      type: Number,
      required: [true, "Diesel litters is required."],
      default: 0,
    },
    driverExpense: {
      type: Number,
      required: [true, "Driver expense is required."],
      default: 0,
    },
    loading: {
      type: Number,
      required: [true, "Loading expense is required."],
      default: 0,
    },
    otherExpenses: {
      type: Number,
      required: [true, "Other expenses value is required."],
      default: 0,
    },
    remainingAmount: {
      type: Number,
      required: [true, "Remaining amount (Profit) calculation is required."],
      default: 0, 
    },
    fuel: {
      type: String,
      trim: true,
      default: "----",
    },
    vendor: {
      type: String,
      trim: true,
      default: "----",
    },

    payment: {
      method: {
        type: String,
        enum: ["pending", "cash", "check", "fuel", "other"],
        default: "pending",
      },
      amountReceived: {
        type: Number,
        default: 0, 
      },
      checkNo: {
        type: String,
        default: "",
      },
      fuelLiters: {
        type: Number,
        default: 0, 
      },
      fuelCompany: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'FuelCompany',                   
  },
      note: {
        type: String, 
        default: "",
      },
    },

    clientDue: {
      type: Number,
      default: 0, 
    },
    clientAdvance: {
      type: Number,
      default: 0, 
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "received"],
      default: "pending",
    },
    billStatus: {
      type: String,
      enum: ["generated", "pending"],
      default: "pending",
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
  { timestamps: true }
);

vehicleEntrySchema.pre("save", function (next) {
  this.totalRate = this.totalSftVehicles * this.rate;

  const totalExpenses =
    this.materialCost +
    this.dieselCost +
    this.driverExpense +
    this.loading +
    this.otherExpenses;

  this.remainingAmount = this.totalRate - totalExpenses;

  const received = this.payment.amountReceived || 0;

  if (received === 0) {
    this.clientDue = this.totalRate;
    this.clientAdvance = 0;
    this.paymentStatus = "pending";
  } else if (received < this.totalRate) {
    this.clientDue = this.totalRate - received;
    this.clientAdvance = 0;
    this.paymentStatus = "partial";
  } else {
    this.clientDue = 0;
    this.clientAdvance = received - this.totalRate;
    this.paymentStatus = "received";
  }

  next();
});

vehicleEntrySchema.index({
  createdAt: -1,
  client: 1,
  site: 1,
});

const EntryVehicle = mongoose.model("EntryVehicle", vehicleEntrySchema);
module.exports = EntryVehicle;