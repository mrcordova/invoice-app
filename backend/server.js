const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const cors = require("cors");
// const data = require("../frontend/data.json"); uncomment to refill database
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { randomBytes, scryptSync } = require('crypto');
const cron = require('node-cron');
// const fs = require('fs');
const multer = require('multer');
const acceptedFileTypes = {'image/jpeg': 'jpeg', 'image/png': 'png', 'image/jpg': 'jpg'};

const storage = multer.diskStorage({
  destination: (res, file, cb) => {
    cb(null, path.join(__dirname, "/uploads/"));
  },
  filename: (req, file, cb) => {
    const { username, id } = jwt.decode(req.token);
    const fileName = `${ username.split(' ').join('_')}_profile_pic.${ acceptedFileTypes[file.mimetype]}`;
  
    cb(null, `${fileName}`);
  }
});

const upload = multer({ storage, limits: {fileSize: 2 * 1024 * 1024} });

require("dotenv").config();

const allowedOrigins = [
  "https://invoice-app-3705.onrender.com",
  'https://invoice-backend.noahprojects.work',
  "http://127.0.0.1:5500",
  "chrome-extension://mpognobbkildjkofajifpdfhcoklimli"
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
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  // const expiresAt = new Date(Date.now() +  15 * 1000);
  // const refreshToken = jwt.sign({ id: user.id, username: user.username }, process.env.REFRESH_SECRET, { expiresIn: "30d" });
  const refreshToken = jwt.sign({ id: user.id, username: user.username }, process.env.REFRESH_SECRET, { expiresIn: "30d" });
  const hashToken = hashPassword(refreshToken);
  const insertQuery = 'INSERT INTO refresh_tokens(user_id, token, expires_at) VALUES (?, ?, ?)';
  
  try {
    const [results, error] = await poolPromise.query({ sql: insertQuery, values: [user.id, hashToken, expiresAt] });
    return refreshToken;
  } catch (error) {
    console.error(`generateRefreshToken: ${error}`);
  }

  // return jwt.sign({ id: user.id, username: user.username }, process.env.REFRESH_SECRET, { expiresIn: "30d" });
}
async function generateAccessToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
}
async function blacklistToken(token) {
  const { exp, id } = jwt.decode(token);
  // console.log(exp);
  const now = Math.floor(Date.now() / 1000);
  const ttl = exp - now;
  const expirDate = new Date(Date.now() + ttl * 1000);

  try {
    const hashToken = hashPassword(token);
    const insertQuery = 'INSERT INTO blacklist_tokens(user_id, token, ttl) VALUES (?, ?, ?)';
    const [result, error] = await poolPromise.query({ sql: insertQuery, values: [id, hashToken, expirDate] });
    return result.affectedRows > 0;
  } catch (error) {
    console.error(`blacklisted: ${error}`);
  }
  
}

async function isTokenBlacklisted(token) {
  try {
    const hashToken = hashPassword(token);
    const selectQuery = 'SELECT * FROM blacklist_tokens WHERE token = ?';
    const [result] = await poolPromise.query({ sql: selectQuery, values: [hashToken] });
    return result.affectedRows > 0;
  } catch (error) {
    console.error(`isTokenBlacked: ${error}`);
  }
}
const extractToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    req.token =  token == 'null' ? null : token;
  
    next();
  } else {
    req.token = undefined;
  }
}
async function validateToken(req, res, next) {
  const refreshToken = req.signedCookies['refresh_token'];
  if (!refreshToken) return res.status(403).send('Token is invalid');

  const blacklisted = await isTokenBlacklisted(refreshToken);
  if (blacklisted) return res.status(403).send('Token is blacklisted');

  next();
  
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

app.use(cookieParser(process.env.COOKIE_SECRET));

app.options("*", cors(corsOptions));

app.use(express.static(path.join(__dirname, "../frontend/")));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
      console.error(`setUpDb: ${error}`);
    }
  }
}
// setUpDb();

async function checkTokens(req, res) {
  // const refreshToken = req.signedCookies['refresh_token'];
  const token = req.token;
  if (!token) {
    return 403;
  };

  try {
  
    const userForAccessToken = jwt.verify(token, process.env.JWT_SECRET);
   
    
  } catch (error) {  
    console.error(`checkTokens ${error}`);
    return 403;
  }

  return 200;
}



app.get('/', (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "../frontend/index.html"));
})

app.post('/upload', extractToken, validateToken, upload.single('file'), async (req, res) => {
  const statusCode = await checkTokens(req, res);
  if (statusCode === 403) {
    return res.status(statusCode).json({ message: 'tokens are invalid' });
  }
  // console.log(req.file);
  const { filename } = req.file;
  // console.log(req.filename);

  try {
    const { username, id } = jwt.decode(req.token);
    const updateQuery = 'UPDATE users SET img = ? WHERE username = ? AND id = ?';
    const [result] = await poolPromise.query({ sql: updateQuery, values: [filename, username, id] });
    res.status(200).json({ file: {filename:`./uploads/${filename}`, "alt": filename, title: "filename" }, success: result.affectedRows > 0 });
  } catch (error) {
    console.error(`upload: ${error}`);
  }
  // const { profilePic } = req.body;
  // fs.writeFile(`${profilePic}.jpg`, profilePic, (err) => {
  //   if (err) throw err;
  //   console.log('File witten successfully');
  //   res.send('picture successfully saved');
  // } )
  // fs.readFile(profilePic, 'utf8', (err, data) => {
  //   if (err) throw err;
  //   console.log(data);
  // });

});
app.get('/uploads/:filename', (req, res) => {
// should I check for refresh token here?
  const { filename } = req.params;
  // console.log(filename);
  res.sendFile(path.join(__dirname, `/uploads/${filename}`));
});
app.get('/profilePic', async (req, res) => {
  //  const statusCode = await checkTokens(req, res);
  // if (statusCode === 403) {
  //   return res.status(statusCode).json({ message: 'tokens are invalid' });
  // }
  // console.log('heer');

  try {
    const { username, id } = jwt.decode(req.signedCookies['refresh_token']);
  
    const selectQuery = 'SELECT img FROM users WHERE username = ? AND id = ? LIMIT 1';
    const [result] = await poolPromise.query({ sql: selectQuery, values: [username, id] });
    const img = result[0].img;
    // console.log(img);
    res.sendFile(path.join(__dirname, `/uploads/${img}`));
  } catch (error) {
    
  }
  // const img = profile_img ?? '../frontend/assets/image-avatar.jpg';
})

app.get("/getInvoices", extractToken, validateToken, async (req, res) => {
  
  const statusCode = await checkTokens(req, res);
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
app.get('/getInvoice/:id', extractToken, validateToken,  async (req, res) => {
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
    console.log(`getInvoice/:id: ${error}`);
  }
});
app.post('/saveInvoice', extractToken, validateToken, async (req, res) => {
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
    console.error(`saveInvoice: ${error}`);
  }
});
app.put('/updateStatus/:id', extractToken, validateToken, async (req, res) => {
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
app.post('/updateInvoice/:id', extractToken,validateToken, async (req, res) => {
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
  const defaultProfileImg = path.join(__dirname, `../frontend/assets/image-avatar.jpg`);

  if (!username || !email || !password || !matchPassword(repeatPassword, password_hash)) {
    return res.status(401).json({message: 'some creditionals are missing'});
  }
  if ( await checkUserExists(username, email)) {
    return res.status(409).json({ message: 'User already exists' });
  }
try {
  const insertQuery = 'INSERT INTO users (username, password_hash, email, img) VALUES (?, ?, ?, ?)';
  const [results, error] = await poolPromise.query({ sql: insertQuery, values: [username, password_hash, email, defaultProfileImg] });
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
      sameSite: 'strict',
      path: '/' ,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    
    res.json({ accessToken, username});
    // res.status(200).sendFile(path.join(__dirname, "../frontend/index.html"))

  } catch (error) {
    console.error(`loginUser: ${error}`);
  
 }
})

app.post('/logout', async (req, res) => {

  const refreshToken = req.signedCookies['refresh_token'];
  if (!refreshToken) return res.status(204).send('Refresh token invalid');
  const hashToken = hashPassword(refreshToken);
  const blackListed = await blacklistToken(refreshToken);
  const deleteQuery = 'DELETE FROM refresh_tokens WHERE token = ?';
  await poolPromise.query({ sql: deleteQuery, values: [hashToken] });
  res.clearCookie('refresh_token', {
    httpOnly: true,
    signed: true,
    secure: true,
    sameSite: 'strict',
    path: '/' ,
  });
  res.send(`Logged out successfully and token black listed: ${blackListed}`);
})
app.delete('/deleteInvoice/:id', extractToken, validateToken, async (req, res) => {
  const statusCode = await checkTokens(req, res) 
  if (statusCode === 403) {
    return res.status(statusCode).json({ message: 'tokens are invalid' });
  }
  try {
    const { id } = req.params;
    const deleteQuery = 'DELETE FROM invoices WHERE id = ? LIMIT 1';
    const [result, error] = await poolPromise.query({ sql: deleteQuery, values: [id] });
    res.status(200).json({ success: result['affectedRows'] > 0 });
    
  } catch (error) {
    console.error(`deleteInvoice: ${error}`);
    res.status(401).json({ success: false });
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


  try {
    const user = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const hashToken = hashPassword(refreshToken);
    const selectQuery = 'SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ? AND expires_at > NOW()';
    const [token] = await poolPromise.query({ sql: selectQuery, values: [hashToken, user.id] });
    if (!token) return res.status(403).json({ message: 'invalid refresh token test' });

    const newAccessToken = await generateAccessToken(user);

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      const hashToken = hashPassword(refreshToken);
      // Optionally delete expired token immediately on TokenExpiredError
      await poolPromise.query('DELETE FROM refresh_tokens WHERE token = ?', [hashToken]);
    }
   
    res.status(403).send('Invalid refresh token');
  }

});


app.listen(PORT, () => {
  console.log(`Server is running of ${PORT}`);
});

const task = cron.schedule('0 0 * * *', async () => {
  try {
    const now = new Date();
    const [result] = await poolPromise.query({ sql: 'DELETE FROM refresh_tokens WHERE expires_at < ?', values: [now] });
    const [blackListResult] = await poolPromise.query({ sql: 'DELETE FROM blacklist_tokens WHERE ttl < ?', values: [now]});
    console.log(`Deleted ${result.affectedRows} expired refresh tokens at ${now}`);
    console.log(`Deleted ${blackListResult.affectedRows} expired blacklisted tokens at ${now}`);
  } catch (error) {
    console.error(`$ cron job : ${error}`);
  }
}, {
  scheduled: true
});

