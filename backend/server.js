const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const cors = require("cors");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3004;

const allowedOrigins = [
  "https://invoice-app-3705.onrender.com",
  "http://127.0.0.1:5500",
];

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, 
  queueLimit: 0,
  typeCast: function (field, next) {
    if (field.type === "NEWDECIMAL") {
      return parseFloat(field.string());
    } else if (field.type === "NEWDATE") {
      
    }
    return next();
  }
})

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-type", "Authorization"],
};

app.use(cors(corsOptions));

app.options("*", cors(corsOptions));

app.use(express.static(path.join(__dirname, "../frontend/")));

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ type: "*/*" }));

app.get("/health-check", async (req, res) => {
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server is running of ${PORT}`);
});
