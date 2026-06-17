const mongoose = require("mongoose");
const logger = require("../logger")("DATABASE");

mongoose.set("strictQuery", false);

/**
 * Connect DB safely (Vercel + local compatible)
 */
const connectDB = async () => {
  try {
    const DB = process.env.DATABASE_URI;

    if (!DB || typeof DB !== "string") {
      throw new Error("DATABASE_URI is missing or invalid in environment variables");
    }

    await mongoose.connect(DB);

    if (process.env.NODE_ENV === "production") {
      logger.info("Database connected.");
    } else {
      console.log("Database connected.");
    }
  } catch (err) {
    logger.error(`Database connection failed. ${err.message}`);
    throw err;
  }
};

/**
 * Get next sequence number (counters collection)
 */
async function getNextInSequence(name) {
  const updatedDocument = await mongoose.connection.db
    .collection("counters")
    .findOneAndUpdate(
      { _id: name },
      { $inc: { currentIDs: 1 } },
      { returnDocument: "after" }
    );

  return updatedDocument?.currentIDs;
}

/**
 * Decrease sequence number
 */
async function decreaseByOneInSequence(name) {
  const updatedDocument = await mongoose.connection.db
    .collection("counters")
    .findOneAndUpdate(
      { _id: name },
      { $inc: { currentIDs: -1 } },
      { returnDocument: "after" }
    );

  return updatedDocument?.currentIDs;
};

module.exports = {
  connectDB,
  getNextInSequence,
  decreaseByOneInSequence,
};