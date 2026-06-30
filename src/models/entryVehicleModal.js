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
      default: 0, // Formula: totalRate - totalExpenses
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

    // --- CLIENT PAYMENT FLOW (Single Way Structure) ---
    payment: {
      method: {
        type: String,
        enum: ["pending", "cash", "check", "fuel", "other"],
        default: "pending",
      },
      amountReceived: {
        type: Number,
        default: 0, // Kitna cash ya value mila
      },
      checkNo: {
        type: String,
        default: "",
      },
      fuelLiters: {
        type: Number,
        default: 0, // Fuel method ke case me kitne liters mila
      },
      fuelCompany: {
      type: mongoose.Schema.Types.ObjectId,  // ✅ String → ObjectId
      ref: 'FuelCompany',                    // ✅ ref add kiya
  },
      note: {
        type: String, // Extra details, partial/full payment info, ya other description ke liye
        default: "",
      },
    },

    // --- CLIENT LEDGER TRACKING ---
    clientDue: {
      type: Number,
      default: 0, // Baqaya Raqam (TotalRate > AmountReceived)
    },
    clientAdvance: {
      type: Number,
      default: 0, // Extra Payment (AmountReceived > TotalRate)
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

// --- PRE-SAVE HOOK FOR AUTOMATIC CALCULATIONS ---
vehicleEntrySchema.pre("save", function (next) {
  // 1. Total Bill Rate Calculation
  this.totalRate = this.totalSftVehicles * this.rate;

  // 2. Internal Profit Calculation (Revenue - Expenses)
  // (Note: Aapke purane hook me 'this.diesel' likha tha jabki key 'dieselCost' hai, maine fix krdiya h)
  const totalExpenses =
    this.materialCost +
    this.dieselCost +
    this.driverExpense +
    this.loading +
    this.otherExpenses;

  this.remainingAmount = this.totalRate - totalExpenses;

  // 3. Client Ledger Logic (Due vs Advance Tracking)
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
    // Agar barabar paise diye hain ya extra advance de diya h
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