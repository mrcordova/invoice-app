const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const cors = require("cors");
// const data = require("../frontend/data.json"); uncomment to refill database
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { randomBytes, scryptSync } = require('crypto');
const cron = require('node-cron');
const fs = require('fs/promises');
const multer = require('multer');
const acceptedFileTypes = { 'image/jpeg': 'jpeg', 'image/png': 'png', "image/webp": 'webp', 'image/svg+xml': 'svg'};
const defaultProfilePic = 'uploads/image-avatar.jpg';
const PORT = process.env.PORT || 3004;
const allowedOrigins = [
  "https://invoice-app-3705.onrender.com",
  'https://invoice-backend.noahprojects.work',
  "http://127.0.0.1:5500",
  "chrome-extension://mpognobbkildjkofajifpdfhcoklimli"
];

const app = express();
require("dotenv").config();

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
  allowedHeaders: ["Content-type", "Authorization", "Access-Control-Allow-Credentials", "Access-Control-Allow-Origin", 'Cache-Control'],
};

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads/"));
  },
  filename: async (req, file, cb) => {

      const { id } = jwt.verify(req.signedCookies['refresh_token'], process.env.REFRESH_SECRET);
      const fileName = `user_${id}_${Date.now()}.${acceptedFileTypes[file.mimetype]}`;
      cb(null, `${fileName}`);
   
  }
});

const upload = multer({ storage, limits: {fileSize: 2 * 1024 * 1024},  fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only images are allowed!'), false);
        }
        cb(null, true); // Accept the file
    } });

// console.log(randomBytes(32).toString("hex"))
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
};
// setUpDb();

const encryptPassword = (password, salt) => {
  return scryptSync(password, salt, 32).toString('hex');
};
const hashPassword = (password) => {
  // const salt = randomBytes(16).toString("hex");
  // return encryptPassword(password, salt) + salt;
  return encryptPassword(password, process.env.SALT);
};
const matchPassword = (password, hash) => {
  // const salt = hash.slice(64);
  const originalPassHash = hash.slice(0, 64);
  // const currentPassHash = encryptPassword(password, salt);
  const currentPassHash = encryptPassword(password, process.env.SALT);
  return originalPassHash === currentPassHash;
};

const extractToken = async (req, res, next) => {
  const token = req.signedCookies['access_token'];
  
  if (token) {
    req.token = token == 'null' ? null : token;
  } else {
    req.token = undefined;
  }
  next();
};

async function checkToken(req, res, next) {
  const token = req.token;
  if (!token) {
    return res.status(403).json({ message: 'tokens are invalid' });
  };
  try {
    const userAccessToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {  
    console.error(`checkTokens ${error}`);
    return res.status(403).json({ message: 'tokens are invalid' });
  }
  next();
};

async function validateToken(req, res, next) {
  const refreshToken = req.signedCookies['refresh_token'];
  if (!refreshToken) {
    return res.status(403).json({ message: 'refresh token not found, pleas log in agian' });
  }

  try {
    
    const { id, username, img } = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const hashRefreshToken = hashPassword(refreshToken);
    const selectQuery = 'SELECT token FROM refresh_tokens WHERE user_id = ? AND token = ?  AND expires_at > NOW()';
    const [result] = await poolPromise.query({ sql: selectQuery, values: [id, hashRefreshToken] });
    if (!result.length) return res.status(403).json({ message: 'Token is invalid' });
    req.user = { id, username, img };
    
    next();
  } catch (error) {
    const blacklisted = await isTokenBlacklisted(refreshToken);
    if (blacklisted) return res.status(403).send('Token is blacklisted');
    return res.status(403).json({ message: 'Token is invalid' });
  }

};

async function generateRefreshToken(user) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
 
  const refreshToken = jwt.sign({ id: user.id, username: user.username, img: user.img }, process.env.REFRESH_SECRET, { expiresIn: "30d" });
  const hashToken = hashPassword(refreshToken);
  const insertQuery = 'INSERT INTO refresh_tokens(user_id, token, expires_at) VALUES (?, ?, ?)';
  
  try {
    const [results, error] = await poolPromise.query({ sql: insertQuery, values: [user.id, hashToken, expiresAt] });
    return refreshToken;
  } catch (error) {
    console.error(`generateRefreshToken: ${error}`);
  }

};
async function generateAccessToken(user) {
  return jwt.sign({ id: user.id, username: user.username, img: user.img }, process.env.JWT_SECRET, { expiresIn: '1h' });
};
async function blacklistToken(token) {
  const { exp, id } = jwt.decode(token);
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
  
};

async function isTokenBlacklisted(token) {
  try {
    const hashToken = hashPassword(token);
    const selectQuery = 'SELECT * FROM blacklist_tokens WHERE token = ?';
    const [results] = await poolPromise.query({ sql: selectQuery, values: [hashToken] });
    return results.length > 0;
  } catch (error) {
    console.error(`isTokenBlacked: ${error}`);
  }
};


 
async function checkUserExists(username) {
  const selectQuery = 'SELECT * FROM users WHERE username = ?';
  const [rows] = await poolPromise.query({ sql: selectQuery, values: [username] });

  return rows.length > 0;
};
async function checkUserExists(username, id) {
  const selectQuery = 'SELECT * FROM users WHERE username = ? AND NOT(id = ?)';
  const [rows] = await poolPromise.query({ sql: selectQuery, values: [username, id] });

  return rows.length > 0;
};
async function checkEmailExists(email) {
  const selectQuery = 'SELECT * FROM users WHERE email = ?';
  const [rows] = await poolPromise.query({ sql: selectQuery, values: [ email] });

  return rows.length > 0;
};



app.use(cors(corsOptions));

app.use(cookieParser(process.env.COOKIE_SECRET));

app.options("*", cors(corsOptions));

// app.use('/assets', express.static(path.join(__dirname, "../frontend/assets"), {
//     setHeaders: (res, path) => {
//         res.set('Cache-Control', 'public, max-age=31536000, immutable');
//     }
// }));

app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));
// app.use('/css/style.css', express.static(path.join(__dirname, "../frontend/css/style.css"), {
//     setHeaders: (res, path) => {
//         res.set('Cache-Control', 'public, max-age=0');
//     }
// }));

app.use(express.static(path.join(__dirname, "../frontend/"), {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).send('File too large. Maximum size is 2MB.');
        }
    } else if (err) {
        return res.status(400).send(err.message);
    }
    next();
});

app.get('/', (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "../frontend/index.html"));
});

// POST API METHODS FOR  USER CREATION and MANANGMENT 
app.post('/registerUser', async (req, res) => {
  const { username, email, password, "repeat-password": repeatPassword } = req.body;
  const password_hash = hashPassword(password);

  if (!username || !email || !password || !matchPassword(repeatPassword, password_hash)) {
    return res.status(401).json({message: 'some creditionals are missing'});
  }
  if (username.includes(" ")) {
    return res.status(401).json({ message: 'username contains spaces' });
  }
  if ( await checkUserExists(username)) {
    return res.status(409).json({ message: 'User already exists' });
  }
  if ( await checkEmailExists(email)) {
    return res.status(409).json({ message: 'Email already exists' });
  }
try {
  const insertQuery = 'INSERT INTO users (username, password_hash, email, img) VALUES (?, ?, ?, ?)';
  const [results, error] = await poolPromise.query({ sql: insertQuery, values: [username, password_hash, email, defaultProfilePic] });
  res.json({ success: true });

} catch (error) {
  console.error(`registerUser: ${error}`);
}
});

app.post('/loginUser', async (req, res) => {
  const { username, password } = req.body;
  try {
    const selectQuery = 'SELECT * FROM users WHERE username = ? LIMIT 1';
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

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      signed: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      signed: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: (1 * 60) * (60 * 1000),
    });
   
    
    res.json({ username, img: user.img });

  } catch (error) {
    console.error(`loginUser: ${error}`);
  
  }
});

app.post('/logout', async (req, res) => {

  const refreshToken = req.signedCookies['refresh_token'];
  if (!refreshToken) return res.status(204).send('Refresh token invalid');
  try {
    const hashToken = hashPassword(refreshToken);
    const blackListed = await blacklistToken(refreshToken);
    if (!blackListed) console.log('failed to blacklist token');
    const deleteQuery = 'DELETE FROM refresh_tokens WHERE token = ?';
    await poolPromise.query({ sql: deleteQuery, values: [hashToken] });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      signed: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });
    res.clearCookie('access_token', {
      httpOnly: true,
      signed: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });
    return res.json({ success: true });
    
  } catch (error) {
    return res.json({ success: false });
  }
});


app.post('/refresh-token', validateToken, async (req, res) => {


  try {
  
    const { user } = req;
   
    const newAccessToken = await generateAccessToken(user);

    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      signed: true,
      secure: true,
      sameSite: 'strict',
      path: '/' ,
      maxAge: (1 * 60) * (60 * 1000),
    });
    res.json({ accessToken: 'created new token' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      const hashToken = hashPassword(refreshToken);
      // Optionally delete expired token immediately on TokenExpiredError
      await poolPromise.query('DELETE FROM refresh_tokens WHERE token = ?', [hashToken]);
    }
   
    res.status(403).json({message: 'Invalid refresh token'});
  }

});

// GET API METHODS FOR RETURING INVOICES
app.get("/getInvoices", extractToken, checkToken, validateToken, async (req, res) => {
  
  const { user: { id } } = req;
  
  try {
    const selectQuery = "SELECT * FROM invoices WHERE user_id = ?";
    const [results] = await poolPromise.query({sql: selectQuery, values: [id]});
    res.json({ invoices: results });
  } catch (error) {
    console.error(`getInvoices: ${error}`);
  }
});

app.get('/getInvoice/:id', extractToken, checkToken, validateToken,  async (req, res) => {
 
  const { user: { id: user_id } } = req;
  try {
    const { id } = req.params;
    const selectQuery = 'SELECT * FROM invoices WHERE id = ? AND user_id = ? LIMIT 1';
    const [invoice] = await poolPromise.query({ sql: selectQuery, values: [id, user_id] });
    res.json(invoice[0]);
  } catch (error) {
    console.log(`getInvoice/:id: ${error}`);
  }
});


// POST API METHODS FOR INVOICE EDITS
app.post('/saveInvoice', extractToken, checkToken, validateToken, async (req, res) => {
  
  const { user: { id: user_id } } = req;
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
      "INSERT INTO invoices(id, user_id, createdAt, paymentDue, description, paymentTerms, clientName, clientEmail, status, senderAddress, clientAddress, items, total) VALUES (?, ?, ?,?,?,?, ?, ?, ?, ?, ?, ?, ?)";
    const [result] = await poolPromise.query({
      sql: insertQuery, values: [id,
        user_id,
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
    res.json({ success: result.affectedRows > 0, result });
  } catch (error) {
    console.error(`saveInvoice: ${error}`);
  }
});

app.post('/updateInvoice/:id', extractToken, checkToken, validateToken, async (req, res) => {
  
  try {
    const { user: { id: user_id } } = req;
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
    const updateQuery = 'UPDATE invoices SET createdAt = ?,  paymentDue = ?, description = ?, paymentTerms = ?, clientName = ?, clientEmail = ?, status = ?, clientAddress = ? , senderAddress = ?, items = ?, total = ? WHERE id = ? AND user_id = ?';
    const [results, error] = await poolPromise.query({ sql: updateQuery, values: [ createdAt, paymentDue, description, paymentTerms, clientName, clientEmail, status, JSON.stringify(clientAddress), JSON.stringify(senderAddress), JSON.stringify(items), total, id, user_id] });
    res.json({ success: true });
  } catch (error) {
    console.error(`updateInvoice: ${error}`)
  }
});

app.put('/updateStatus/:id', extractToken, checkToken, validateToken, async (req, res) => {
 
  try {
    const { user: { id: user_id } } = req;
    const { id } = req.params;
    const { status } = req.body;
    const updateQuery = `UPDATE invoices SET status = ? WHERE id = ? AND user_id = ?`;
    const [result, error] = await poolPromise.query({ sql: updateQuery, values: [status, id, user_id] });
    res.json({ success: true })
    
  } catch (error) {
    console.error(`updateStatus: ${error}`)
  }
});

app.post('/upload', extractToken, checkToken, validateToken, upload.single('file'), async (req, res) => {
  
  const { username } = req.body;
  const { id } = req.user;
  if (await checkUserExists(username, id)) {
    return res.status(403).json({ message: 'username exisits already!' });
  };

  try {
    const { user: { id } } = req;
    const selectQuery = 'SELECT img, username FROM users WHERE id = ? LIMIT 1';
    const [selectResult] = await poolPromise.query({ sql: selectQuery, values: [id] });
    const newFileName = req.file ? `/uploads/${req.file?.filename}` : selectResult[0].img;
    
    
    
    if (selectResult.length > 0 && defaultProfilePic !== selectResult[0].img && newFileName !== selectResult[0].img) {

      const prevFilePath = path.join(__dirname, `${selectResult[0].img}`);
      await fs.access(prevFilePath);
      await fs.unlink(prevFilePath);
    }
    
    const updateQuery = 'UPDATE users SET img = ?, username = ? WHERE id = ?';
    const [result] = await poolPromise.query({ sql: updateQuery, values: [newFileName, username, id] });
   
    res.status(200).json({ file: {filename: newFileName, "alt": newFileName, title: newFileName }, username, success: result.affectedRows > 0 });
  } catch (error) {
    console.error(` upload filename: ${error}`);
    res.status(400).json({ message: 'upload failed' });
    }


});

// DELETE API METHODS FOR INVOICE
app.delete('/deleteInvoice/:id', extractToken, checkToken, validateToken, async (req, res) => {
  
  try {
    const { user: { id: user_id } } = req;
    const { id } = req.params;
    const deleteQuery = 'DELETE FROM invoices WHERE id = ? AND user_id = ? LIMIT 1';
    const [result, error] = await poolPromise.query({ sql: deleteQuery, values: [id, user_id] });
    res.status(200).json({ success: result['affectedRows'] > 0 });
    
  } catch (error) {
    console.error(`deleteInvoice: ${error}`);
    res.status(401).json({ success: false });
  }
});


app.get("/health-check", async (req, res) => {
  try {
    const selectQuery = 'Select 1 from invoices WHERE user_id = ?';
    const [result, error] = await poolPromise.query({ sql: selectQuery, values: [null]});
    res.json({ success: true });
    
  } catch (error) {
    console.error(`health-check: ${error}`);
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

