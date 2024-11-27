const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const cors = require("cors");
const data = require("../frontend/data.json");
const { randomBytes, scryptSync } = require('crypto');

// console.log(data);

require("dotenv").config();
// console.log(process.env.SALT);
const app = express();
const PORT = process.env.PORT || 3004;
const encryptPassword = (password, salt) => {
  return scryptSync(password, salt, 32).toString('hex');
}
const hashPassword = (password) => {
  // const salt = randomBytes(16).toString("hex");
  // return encryptPassword(password, salt) + salt;
  return encryptPassword(password, process.env.SALT);
}
const matchPassword = (password, hash) => {
  // const salt = hash.slice(64);
  const originalPassHash = hash.slice(0, 64);
  // const currentPassHash = encryptPassword(password, salt);
  const currentPassHash = encryptPassword(password, process.env.SALT);
  return originalPassHash === currentPassHash;
}
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
  },
});
const poolPromise = pool.promise();

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

async function setUpDb() {
  for (const invoice of data) {
    const {
      id,
      createdAt,
      paymentDue,
      description,
      paymentTerms,
      clientName,
      clientEmail,
      clientAddress,
      status,
      senderAddress,
      items,
      total,
    } = invoice;

    const insertQuery =
      "INSERT INTO invoices(id, createdAt, paymentDue, description, paymentTerms, clientName, clientEmail, status, senderAddress, clientAddress, items, total) VALUES (?, ?,?,?,?, ?, ?, ?, ?, ?, ?, ?)";
    try {
      await poolPromise.query({
        sql: insertQuery,
        values: [
          id,
          createdAt,
          paymentDue,
          description,
          paymentTerms,
          clientName,
          clientEmail,
          status,
          JSON.stringify(clientAddress),
          JSON.stringify(senderAddress),
          JSON.stringify(items),
          total,
        ],
      });
    } catch (error) {
      console.error(error);
    }
  }
}
// setUpDb();

app.get("/getInvoices", async (req, res) => {
  try {
    const selectQuery = "SELECT * FROM invoices";
    const [results] = await poolPromise.query(selectQuery);
    res.json({ invoices: results });
  } catch (error) {
    console.error(`getInvoices: ${error}`);
  }
});
app.get('/getInvoice/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const selectQuery = 'SELECT * FROM invoices WHERE id = ? LIMIT 1';
    const [invoice] = await poolPromise.query({ sql: selectQuery, values: [id] });
    res.json(invoice[0]);
  } catch (error) {
    console.log(`getInvoice: ${error}`);
  }
});
app.post('/saveInvoice', async (req, res) => {
  try {
    const {
      id,
      createdAt,
      paymentDue,
      description,
      paymentTerms,
      clientName,
      clientEmail,
      clientAddress,
      status,
      senderAddress,
      items,
      total,
    } = req.body;
    const insertQuery =
      "INSERT INTO invoices(id, createdAt, paymentDue, description, paymentTerms, clientName, clientEmail, status, senderAddress, clientAddress, items, total) VALUES (?, ?,?,?,?, ?, ?, ?, ?, ?, ?, ?)";
    const [result] = await poolPromise.query({
      sql: insertQuery, values: [id,
        createdAt,
        paymentDue,
        description,
        paymentTerms,
        clientName,
        clientEmail,
        status,
        JSON.stringify(clientAddress),
        JSON.stringify(senderAddress),
        JSON.stringify(items),
        total]
    });
    res.json({ success: true, result });
  } catch (error) {
    console.log(`saveInvoice: ${error}`);
  }
});
app.put('/updateStatus/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updateQuery = `UPDATE invoices SET status = ? WHERE id = ?`;
    const [result, error] = await poolPromise.query({ sql: updateQuery, values: [status, id] });
    res.json({ success: true })
    
  } catch (error) {
    console.error(`updateStatus: ${error}`)
  }
});
app.post('/updateInvoice/:id',async (req, res) => {
  try {
    const { id } = req.params;
     const {
     createdAt,
      paymentDue,
      description,
      paymentTerms,
      clientName,
      clientEmail,
      status,
      clientAddress,
      senderAddress,
      items,
      total,
    } = req.body;
    const updateQuery = 'UPDATE invoices SET createdAt = ?,  paymentDue = ?, description = ?, paymentTerms = ?, clientName = ?, clientEmail = ?, status = ?, clientAddress = ? , senderAddress = ?, items = ?, total = ? WHERE id = ?';
    const [results, error] = await poolPromise.query({ sql: updateQuery, values: [ createdAt, paymentDue, description, paymentTerms, clientName, clientEmail, status, JSON.stringify(clientAddress), JSON.stringify(senderAddress), JSON.stringify(items), total, id] });
    res.json({ success: true });
  } catch (error) {
    console.error(`updateInvoice: ${error}`)
  }
});
app.post('/registerUser', (req, res) => {
  const { username, email, password } = req.body;
  console.log(username, email, password);
  res.send('done');
});
app.delete('/deleteInvoice/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleteQuery = 'DELETE FROM invoices WHERE id = ? LIMIT 1';
    const [result, error] = await poolPromise.query({ sql: deleteQuery, values: [id] });
    res.json({ success: true });
    
  } catch (error) {
    console.error(`deleteInvoice: ${error}`);
  }
});
app.get("/health-check", async (req, res) => {
  try {
    const selectQuery = 'Select 1 from invoices';
    const [result, error] = await poolPromise.query(selectQuery);
    res.json({ success: true });
    
  } catch (error) {
    console.error(`health-check: ${error}`);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running of ${PORT}`);
});
