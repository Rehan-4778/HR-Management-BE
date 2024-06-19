const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`.green.underline);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;
