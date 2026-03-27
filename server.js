require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Create MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'raphael@2005',
  database: 'portfolio'
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database: ' + err.stack);
    // Don't crash immediately, wait until we actually need the db
    return;
  }
  console.log('Connected to MySQL database!');
  
  // Create table if it doesn't exist
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.query(createTableQuery, (err, result) => {
    if (err) {
      console.error('Error creating table: ', err);
    } else {
      console.log('Contacts table ready.');
    }
  });
});

// Set up Nodemailer transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// API endpoint for contact form submission
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  const query = 'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)';
  
  db.query(query, [name, email, message], (err, result) => {
    if (err) {
      console.error('Error inserting into database:', err);
      return res.status(500).json({ success: false, message: 'Database error.' });
    }
    
    // Prepare email message
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `New Portfolio Contact from ${name}`,
        text: `You have received a new contact message from your portfolio.\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}`,
        replyTo: email
    };

    // Send email silently in the background
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent successfully: ' + info.response);
        }
    });

    res.status(200).json({ success: true, message: 'Message sent successfully!' });
  });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
