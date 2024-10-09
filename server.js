const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const colors = require("colors");
const morgan = require("morgan");
const cors = require("cors");
const errorHandler = require("./middlewares/error");
const bodyParser = require("body-parser");
const path = require("path");

// Route files
const auth = require("./routes/auth");

// Load env vars
dotenv.config({ path: "./.env" });

// Connect database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Body parser
app.use(
  bodyParser.json({
    limit: "50mb",
  })
);
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
  })
);
app.use(cors());

// Enable CORS
app.use(cors());

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.static(path.join(__dirname, "../HR-Management-FE/dist/")));

// Mount Routers
app.use("/api/v1/auth", auth);
app.use("/api/v1/onboard", require("./routes/onboard"));
app.use("/api/v1/roles", require("./routes/roles"));
app.use("/api/v1/employee", require("./routes/employee"));
app.use("/api/v1/timeLog", require("./routes/timeLog"));
app.use("/api/v1/timeOff", require("./routes/timeOff"));
app.use("/api/v1/setting", require("./routes/setting"));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../HR-Management-FE/dist/", "index.html"));
});

// Error handler
app.use(errorHandler);

app.use("/", (req, res) => {
  res.status(404).json({ success: false, msg: "Page not found" });
});

const server = app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.bgGreen
      .bold
  );
});

// handle unhandled promise rejection
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error : ${err}`.red);

  server.close(() => process.exit(1));
});
