const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const cors = require("cors");
const data = require("../frontend/data.json");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { randomBytes, scryptSync } = require('crypto');



require("dotenv").config();

const allowedOrigins = [
  "https://invoice-app-3705.onrender.com",
  "http://127.0.0.1:5500",
];
const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-type", "Authorization", "Access-Control-Allow-Credentials", "Access-Control-Allow-Origin"],
};
const app = express();
// console.log(randomBytes(32).toString("hex"))

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


async function checkUserExists(username, email) {
  const selectQuery = 'SELECT * FROM users WHERE username = ? OR email = ?';
  const [rows] = await poolPromise.query({ sql: selectQuery, values: [username, email] });

  return rows.length > 0;
}

async function generateRefreshToken(user) {
  // const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const expiresAt = new Date(Date.now() +  15 * 1000);
  // const refreshToken = jwt.sign({ id: user.id, username: user.username }, process.env.REFRESH_SECRET, { expiresIn: "30d" });
  const refreshToken = jwt.sign({ id: user.id, username: user.username }, process.env.REFRESH_SECRET, { expiresIn: "15s" });
  const hashToken = hashPassword(refreshToken);
  const insertQuery = 'INSERT INTO refresh_tokens(user_id, token, expires_at) VALUES (?, ?, ?)';
  
  try {
    const [results, error] = await poolPromise.query({ sql: insertQuery, values: [user.id, hashToken, expiresAt] });
  } catch (error) {
    console.error(`generateRefreshToken: ${error}`);
  }

  return refreshToken;
  // return jwt.sign({ id: user.id, username: user.username }, process.env.REFRESH_SECRET, { expiresIn: "30d" });
}
async function generateAccessToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '20s' });
}
// async function generateRefreshToken(userId) {
//   const refreshToken = randomBytes(64).toString('hex');
//   const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days;

//   const insertQuery = 'INSERT INTO refresh_tokens(user_id, token, expires_at) VALUES (?, ?, ?)';
//   const [results, error] = await poolPromise.query({ sql: insertQuery, values: [userId, refreshToken, expiresAt] });
//   return refreshToken;
// }
// async function refreshAccessToken(refreshToken) {
//   const selectQuery = ' SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()';
//   const [rows] = await poolPromise.query({ sql: selectQuery, values: [refreshToken] })
  
//   const tokenData = rows[0];
//   if (!tokenData) { 
//     console.error('refresh token expired');

//   }
//   const userSelectQuery = 'SELECT * FROM users WHERE id = ?';
//   const [userRows] = await poolPromise.query({ sql: userSelectQuery, values: [tokenData.user_id] });
//   const user = userRows[0];
//   const newAccessToken = jwt.sign({id: user.id, username: user.username}, process.env.JWT_SECRET, {expiresIn: '1h'})
//   return newAccessToken;
// }
async function checkUserToken(token) {
  const hashToken = hashPassword(token);
  const selectQuery = 'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()';
  const [rows] = await poolPromise.query({ sql: selectQuery, values: [ hashToken] });

  return (rows.length > 0);
}
const extractToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // console.log(authHeader);
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    // console.log(!token)
    // if (!token) return res.sendStauts(403);
    // const token  = jwt.verify(tokenStr, process.env.JWT_SECRET);
    req.token =  token == 'null' ? null : token;
    // console.log(token)
    // if (!user) return res.sendStauts(401);
    // req.user = user
    next();
  } else {
    req.token = undefined;
  }
}
 
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



app.use(cors(corsOptions));

// app.use(extractToken);
app.use(cookieParser(process.env.COOKIE_SECRET));

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

async function checkTokens(req, res) {
  const refreshToken = req.signedCookies['refresh_token'];
  const token = req.token;
  if (!token) {
    return 403;
  };
  if (!refreshToken) {
    return 403;
  }
  try {
    const user = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    // console.log(refreshToken);
    const userForAccessToken = jwt.verify(token, process.env.JWT_SECRET);
    // if (!user || !userForAccessToken) {
      // console.log(user, "here")
      // return 403;
    // }
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const deleteQuery = 'DELETE FROM refresh_tokens WHERE token = ? AND expires_at < NOW()';
      const hashToken = hashPassword(refreshToken);
      const [result] = await poolPromise.query({ sql: deleteQuery, values: [hashToken] });
      // console.log(result['affectedRows']);
      if (result['affectedRows'] > 0) {
          res.clearCookie('refresh_token', {
              httpOnly: true,
              signed: true,
              secure: true,
              sameSite: 'None',
              path: '/' ,
          });
      }
      // if (result)
      // console.log(hashToken);
    console.error(`check tokens ${error}`);
  } else {
    console.error(`check tokens  ${error}`);
    }
    
    return 403;
  }

  return 200;
}

app.get("/getInvoices", extractToken, async (req, res) => {
  
  const statusCode = await checkTokens(req, res);
  // console.log(statusCode);
  if (statusCode === 403) {
    return res.status(statusCode).json({ message: 'tokens are invalid' });
  }
  try {
    const selectQuery = "SELECT * FROM invoices";
    const [results] = await poolPromise.query(selectQuery);
    res.json({ invoices: results });
  } catch (error) {
    console.error(`getInvoices: ${error}`);
  }
});
app.get('/getInvoice/:id', extractToken,  async (req, res) => {
  const statusCode = await checkTokens(req, res) 
  if (statusCode === 403) {
    return res.status(statusCode).json({ message: 'tokens are invalid' });
  }
  try {
    const { id } = req.params;
    const selectQuery = 'SELECT * FROM invoices WHERE id = ? LIMIT 1';
    const [invoice] = await poolPromise.query({ sql: selectQuery, values: [id] });
    res.json(invoice[0]);
  } catch (error) {
    console.log(`getInvoice: ${error}`);
  }
});
app.post('/saveInvoice', extractToken, async (req, res) => {
  const statusCode = await checkTokens(req, res) 
  if (statusCode === 403) {
    return res.status(statusCode).json({ message: 'tokens are invalid' });
  }
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
app.put('/updateStatus/:id', extractToken, async (req, res) => {
  const statusCode = await checkTokens(req, res) 
  if (statusCode === 403) {
    return res.status(statusCode).json({ message: 'tokens are invalid' });
  }
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
app.post('/updateInvoice/:id', extractToken, async (req, res) => {
  const statusCode = await checkTokens(req, res) 
  if (statusCode === 403) {
    return res.status(statusCode).json({ message: 'tokens are invalid' });
  }
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
app.post('/registerUser', async (req, res) => {
  const { username, email, password, "repeat-password":repeatPassword } = req.body;
  const password_hash = hashPassword(password);

  if (!username || !email || !password || !matchPassword(repeatPassword, password_hash)) {
    return res.status(401).json({message: 'some creditionals are missing'});
  }
  if ( await checkUserExists(username, email)) {
    return res.status(409).json({ message: 'User already exists' });
  }
try {
  const insertQuery = 'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)';
  const [results, error] = await poolPromise.query({ sql: insertQuery, values: [username, password_hash, email] });
  res.json({ success: true });

} catch (error) {
  console.error(`registerUser: ${error}`);
}
});

app.post('/loginUser', async (req, res) => {
  const { username, password } = req.body;
  try {
    const selectQuery = 'SELECT * FROM users WHERE username = ?';
    const [rows] = await poolPromise.query({ sql: selectQuery, values: [username] });
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (!matchPassword(password, user.password_hash)) {
      return res.status(401).json({ message: "Password is incorrect" });
    }
    const refreshToken = await generateRefreshToken(user);
    const accessToken = await generateAccessToken(user);
  
    // res.cookie('refresh_token', refreshToken, {
    //   httpOnly: true,
    //   signed: true,
    //   secure: true,
    //   sameSite: 'None',
    //   path: '/' ,
    //   maxAge: 30 * 24 * 60 * 60 * 1000,
    // });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      signed: true,
      secure: true,
      sameSite: 'None',
      path: '/' ,
      maxAge: 31 * 24 * 60 * 60 * 1000,
    });
    
    res.json({ accessToken });

  } catch (error) {
    console.error(`loginUser: ${error}`);
  
 }
})

app.post('/logout', (req, res) => {
  res.clearCookie('refresh_token', {
    httpOnly: true,
    signed: true,
    secure: true,
    sameSite: 'None',
    path: '/' ,
  });
  res.send("Logged out successfully");
})
app.delete('/deleteInvoice/:id', extractToken, async (req, res) => {
  const statusCode = await checkTokens(req, res) 
  if (statusCode === 403) {
    return res.status(statusCode).json({ message: 'tokens are invalid' });
  }
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

app.post('/refresh-token', async (req, res) => {
  const refreshToken = req.signedCookies['refresh_token'];
  if (!refreshToken) {
    // console.log(refreshToken);
    return res.status(403).json({ message: 'refresh token not found, pleas log in agian' });
  }

  // if (!checkUserToken(refreshToken)) {
  //   const deleteQuery = 'DELETE FROM refresh_tokens WHERE token = ?';
  //   const hashToken = hashPassword(refreshToken);
  //   const [result] = await poolPromise.query({ sql: deleteQuery, values: [hashToken] });
  //   return res.status(403).json({ message: 'refresh token expired' });
  // }

  try {
    const user = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const newAccessToken = await generateAccessToken(user);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      console.error(`refresh_token expires: ${err.expiresAt}`);
    } else {
      console.error(`refresh_token message: ${err.message}`);
    }
    res.status(403).send('Invalid refresh token');
  }
  // jwt.verify(refreshToken, process.env.)

});

app.listen(PORT, () => {
  console.log(`Server is running of ${PORT}`);
});
