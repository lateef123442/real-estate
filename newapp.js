// Step 1: Node modules export
const fs = require('fs');
const path = require('path');
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mysql = require('mysql');
const multer = require('multer');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const bcrypt = require('bcrypt'); // For password hashing
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const validator = require('validator');
require('dotenv').config();


const newapp2 = express();
newapp2.use(cors());
newapp2.use(express.json());
newapp2.use(express.urlencoded({ extended: true }));

// Middleware for handling file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
    }
});

const upload = multer({ storage: storage });

// Set up session middleware
newapp2.use(session({
    secret: 'lateef.2008',
    resave: false,
    saveUninitialized: true
}));

// Authentication middleware
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}


// Initialize Passport.js
newapp2.use(passport.initialize());
newapp2.use(passport.session());

// Serialize user into the session
passport.serializeUser ((user, done) => {
    done(null, user.id); // Store user ID in session
});

// Deserialize user from the session
passport.deserializeUser ((id, done) => {
    // Find user by ID in the database
    connection.query('SELECT * FROM signin WHERE id = ?', [id], (err, results) => {
        if (err) return done(err);
        done(null, results[0]); // Populate req.user with user data
    });
});

// Configure your mail transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your email service
    auth: {
        user: 'ibarealestate2023@gmail.com', // your email
        pass: 'zfom ixun dqvw cbsp' // for Gmail, you might need an App Password
    }
});



// Middleware to check if user is logged in
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// Database connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    multipleStatements: process.env.DB_MULTIPLE_STATEMENTS === 'true',
    queueLimit: Number(process.env.DB_QUEUE_LIMIT),
    acquireTimeout: Number(process.env.DB_ACQUIRE_TIMEOUT)
});

// Connect to the database
connection.connect((error) => {
    if (error) {
        console.error('Database connection error:', error);
    } else {
        console.log('Database Connected!');
    }
});

// Set views file
newapp2.set('views', path.join(__dirname, 'views'));
newapp2.use('/img', express.static(path.join(__dirname, 'public', 'img')));
newapp2.use('/css', express.static(path.join(__dirname, 'public', 'css')));
newapp2.use('/plugins', express.static(path.join(__dirname, 'public', 'plugins')));
newapp2.use('/dist', express.static(path.join(__dirname, 'public', 'dist')));
newapp2.use('/js', express.static(path.join(__dirname, 'public', 'js')));
newapp2.use('/data', express.static(path.join(__dirname, 'public', 'data')));
newapp2.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set view engine
newapp2.set('view engine', 'ejs');

// Body parser middleware
newapp2.use(bodyParser.json({ limit: '50mb' }));
newapp2.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 1000000 }));

// API to check login status (for frontend JS)
newapp2.get('/api/check-login', (req, res) => {
  if (req.user) {
    res.json({ loggedIn: true, username: req.user.firstName });
  } else {
    res.json({ loggedIn: false });
  }
});

// Render website page
newapp2.get('/' ,(req, res) => {
      connection.query("SELECT * FROM sell_images LIMIT 3" , (err, card) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        } 
        else {
            // Pass the card data and isAdmin flag to the sell-page template
            res.render('website', {
                card,
              
            });
        }
    });
});

// Assuming you have EJS set up as your view engine (from previous context)
newapp2.get('/website', (req, res) => {
    // Render your main website template (replace 'website' with your actual EJS file name)
    res.render('website', { /* Pass any data needed, e.g., title: 'IBA Real Estate' */ });
});

// Render login page
newapp2.get('/login', (req, res) => {
    res.render('login');
});


//render forgotten password
newapp2.get('/forgot-password.html', (req, res) => {
    res.render('forgotten-password');
});




newapp2.post('/submit', (req, res) => {
    const { firstName, middleName, lastName, email, phone, confirmPassword } = req.body;

    // Email validation
    if (!validator.isEmail(email)) {
        return res.status(400).render('invalid-email', {
            error: 'Please provide a valid email address'
        });
    }

    const checkEmailQuery = 'SELECT COUNT(*) AS count FROM signin WHERE email = ?';
    connection.query(checkEmailQuery, [email], (err, results) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        }

        if (results[0].count > 0) {
            return res.render('invalid-email.ejs', {
                error: 'This email is already registered'
            });
        }

        // Hash password
        const hashedPassword = bcrypt.hashSync(confirmPassword, 10);

        const sqlInsert = `INSERT INTO signin (firstName, middleName, lastName, email, phone, confirmPassword) VALUES (?, ?, ?, ?, ?, ?)`;
        connection.query(sqlInsert, [firstName, middleName, lastName, email, phone, hashedPassword], (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Server error');
            }
            
            // Send welcome email
            const mailOptions = {
                from: 'lateefahmed3852@gmail.com',
                to: email,
                subject: 'Welcome to Iba Real Estate',
                html: `
                    <h1>Welcome to Iba Real Estate!</h1>
                    <p>Dear ${firstName} ${lastName},</p>
                    <p>Thank you for creating an account with Iba Real Estate. We're excited to help you find your dream property!</p>
                    <p>If you have any questions, don't hesitate to contact our support team.</p>
                    <p>Best regards,<br>The Iba Real Estate Team</p>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                    // You might want to continue anyway since the registration succeeded
                } else {
                    console.log('Email sent:', info.response);
                }
            });

            console.log('User registered successfully');
            return res.render('valid-email');
        });
    });
});


// Display if email for registration already exists
newapp2.get('/invalid-reg-details', (req, res) => {
    res.render('signin-page');
});

// Display if email for registration doesn't exist
newapp2.get('/valid-reg-details', (req, res) => {
    res.render('login');
});

// If user already has an account
newapp2.get('/already-have-acct', (req, res) => {
    res.render('login');
});

// Routes for login
// Routes for login
newapp2.post('/signin', (req, res) => {
    const { email, password } = req.body;

    const sqlSelect = `SELECT * FROM signin WHERE email = ?`;
    connection.query(sqlSelect, [email], (err, results) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        }
     connection.query("SELECT * FROM sell_images LIMIT 3" , (err, card) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        } 

        if (results.length > 0) {
            // Compare the hashed password
            const user = results[0];
            if (bcrypt.compareSync(password, user.confirmPassword)) {
                console.log("Valid login");
                req.login(user, (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Login error');
                    }

                    // Check if the user is the specific admin
                    if (email === 'ibarealestate2023@gmail.com') {
                        req.session.isAdmin = true; // Set admin flag in session for this admin
                    } else {
                        req.session.isAdmin = false; // Ensure it's false for non-admins
                        return res.render('website',{card});
                    }

                    // Pass the isAdmin flag to the valid-login template
                    return res.render('valid-login', {
                        username: user.firstName,
                        surname: user.lastName,
                        isAdmin: req.session.isAdmin // Pass the isAdmin flag
                    });
                });
            } else {
                console.log("Invalid login");
                res.render('invalid-login');
            }
        } else {
            console.log("Invalid login");
            res.render('invalid-login');
        }
    });
});});

// Valid login details
newapp2.get('/valid-login', ensureAuthenticated, (req, res) => {
    // Check if the user is logged in
    if (!req.user) {
        return res.status(401).send('Unauthorized: Please log in first.');
    }

    const userId = req.user.id; // Get the user ID from the session
    const userEmail = req.user.email; // Get the user email from the session

    // Query to get the user's details from the signin database
    const sqlSelect = `SELECT * FROM signin WHERE id = ?`;
    connection.query(sqlSelect, [userId], (err, results) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        }

        if (results.length > 0) {
            const user = results[0]; // Get the user details

            // Determine if the user is an admin based on their email
            const isAdmin = userEmail === 'ibarealestate2023@gmail.com';

            // Query to get the sell images
            connection.query("SELECT * FROM sell_images", (err, card) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).send('Server error');
                } else {
                    // Pass the user details and isAdmin flag to the index template
                    res.render('index', {
                        card,
                        isAdmin, // Pass the isAdmin flag
                        userId: user.id,
                        userEmail: user.email
                    });
                }
            });
        } else {
            return res.status(404).send('User  not found');
        }
    });
});





// Invalid login
newapp2.get('/invalid-login', (req, res) => {
    res.render('login');
});

// Navigation begins
// Index
newapp2.get('/index.html', ensureAuthenticated, (req, res) => {
    // Check if the user is logged in
    if (!req.user) {
        return res.status(401).send('Unauthorized: Please log in first.');
    }

    const userEmail = req.user.email; // Get the user email from the session

    // Determine if the user is an admin based on their email
    const isAdmin = userEmail === 'ibarealestate2023@gmail.com';

    connection.query("SELECT * FROM sell_images", (err, card) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        } else {
            // Pass the card data and isAdmin flag to the index template
            res.render('index', {
                card,
                isAdmin // Pass the isAdmin flag
            });
        }
    });
});


// Buy page
newapp2.get('/buy-page.html', ensureAuthenticated, (req, res)=> {
    // Check if the user is logged in
    if (!req.user) {
        return res.status(401).send('Unauthorized: Please log in first.');
    }

    const userEmail = req.user.email; // Get the user email from the session

    // Determine if the user is an admin based on their email
    const isAdmin = userEmail === 'ibarealestate2023@gmail.com';

    connection.query("SELECT * FROM sell_images WHERE rentSell = 'sell'", (err, card) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error'); // Send a 500 error response
        } else {
            // Render the buy page and pass the card data and isAdmin flag
            res.render('buy-page', {
                card,
                isAdmin // Pass the isAdmin flag
            });
        }
    });
});


// Home improvement
newapp2.get('/home-improvemet-page.html', ensureAuthenticated, (req, res) => {
    // Check if the user is logged in
    if (!req.user) {
        return res.status(401).send('Unauthorized: Please log in first.');
    }

    const userEmail = req.user.email; // Get the user email from the session

    // Determine if the user is an admin based on their email
    const isAdmin = userEmail === 'ibarealestate2023@gmail.com';

    // Render the home improvement page and pass the isAdmin flag
    res.render('home-improvemet-page', {
        isAdmin // Pass the isAdmin flag
    });
});


// Sell page
newapp2.get('/sell-page.html', ensureAuthenticated, (req, res) => {
    // Check if the user is logged in
    if (!req.user) {
        return res.status(401).send('Unauthorized: Please log in first.');
    }

    const userEmail = req.user.email; // Get the user email from the session

    // Determine if the user is an admin based on their email
    const isAdmin = userEmail === 'ibarealestate2023@gmail.com';

    connection.query("SELECT * FROM sell_images", (err, card) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        } else {
            // Pass the card data and isAdmin flag to the sell-page template
            res.render('sell-page', {
                card,
                isAdmin // Pass the isAdmin flag
            });
        }
    });
});


// Rent page
newapp2.get('/rent-page.html', ensureAuthenticated, (req, res) => {
    // Check if the user is logged in
    if (!req.user) {
        return res.status(401).send('Unauthorized: Please log in first.');
    }

    const userEmail = req.user.email; // Get the user email from the session

    // Determine if the user is an admin based on their email
    const isAdmin = userEmail === 'ibarealestate2023@gmail.com';

    connection.query("SELECT * FROM sell_images WHERE rentSell = 'rent'", (err, card) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        } else {
            // Pass the card data and isAdmin flag to the rent-page template
            res.render('rent-page', {
                card,
                isAdmin // Pass the isAdmin flag
            });
        }
    });
});


// Message page
newapp2.get('/message-page.html', ensureAuthenticated, (req, res)=> {
    // Check if the user is logged in
    if (!req.user) {
        return res.status(401).send('Unauthorized: Please log in first.');
    }

    const userEmail = req.user.email; // Get the user email from the session

    // Determine if the user is an admin based on their email
    const isAdmin = userEmail === 'ibarealestate2023@gmail.com';

    // Render the message page and pass the isAdmin flag
    res.render('message-page', {
        isAdmin // Pass the isAdmin flag
    });
});


// Setting page
newapp2.get('/setting-page.html', ensureAuthenticated, (req, res) => {
    // Check if the user is logged in
    if (!req.user) {
        return res.status(401).send('Unauthorized: Please log in first.');
    }

    const userEmail = req.user.email; // Get the user email from the session

    // Determine if the user is an admin based on their email
    const isAdmin = userEmail === 'ibarealestate2023@gmail.com';

    // Render the setting page and pass the isAdmin flag
    res.render('setting-page', {
        isAdmin // Pass the isAdmin flag
    });
});


//sales-approval
newapp2.get('/sales-approval.html', ensureAuthenticated, (req, res) => {
    // Check if the user is logged in
    if (!req.user) {
        return res.status(401).send('Unauthorized: Please log in first.');
    }

    const userEmail = req.user.email; // Get the user email from the session

    // Determine if the user is an admin based on their email
    const isAdmin = userEmail === 'ibarealestate2023@gmail.com';

    connection.query("SELECT * FROM sales_approval", (err, card) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        } else {
            // Pass the card data and isAdmin flag to the sales-approval template
            res.render('sales-approval', {
                card,
                isAdmin // Pass the isAdmin flag
            });
        }
    });
});




// Notification
newapp2.get('/notificatin-page.html', ensureAuthenticated, (req, res) => {
    // Check if the user is logged in
    if (!req.user) {
        return res.status(401).send('Unauthorized: Please log in first.');
    }

    const userEmail = req.user.email; // Get the user email from the session

    // Determine if the user is an admin based on their email
    const isAdmin = userEmail === 'ibarealestate2023@gmail.com';

    // Render the notification page and pass the isAdmin flag
    res.render('notification-page', {
        isAdmin // Pass the isAdmin flag
    });
});


//request tour
newapp2.get('/tour-requested.html', ensureAuthenticated, (req, res)=> {
    // Check if the user is logged in
    if (!req.user) {
        return res.status(401).send('Unauthorized: Please log in first.');
    }

    const userEmail = req.user.email; // Get the user email from the session

    // Determine if the user is an admin based on their email
    const isAdmin = userEmail === 'ibarealestate2023@gmail.com';

    const sqlQuery = `
        SELECT *, (SELECT COUNT(*) FROM request_tour) AS count 
        FROM request_tour`; // Adjust the query as per your table structure

    connection.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('Error fetching tour requests:', err.message);
            return res.status(500).send('Database query error.');
        }

        // Get the count from the result
        const rowCount = results.length > 0 ? results[0].count : 0; // Ensure there's at least one result

        // Render the requested tour page with the fetched data and isAdmin flag
        res.render('requested-tour', {
            card: results,
            rowCount,
            isAdmin // Pass the isAdmin flag
        });
    });
});



// Profile
newapp2.get('/profile-page.html', ensureAuthenticated, (req, res) => {
    // Check if the user is authenticated
    if (!req.user || !req.user.id) {
        return res.redirect('/login'); // Redirect to login if not authenticated
    }

    const userEmail = req.user.email; // Get the user email from the session

    // Determine if the user is an admin based on their email
    const isAdmin = userEmail === 'ibarealestate2023@gmail.com';

    connection.query('SELECT id, firstName, middleName, lastName, email, phone FROM signin WHERE id = ?', 
        [req.user.id], (err, results) => {
            if (err) {
                console.error(err); // Log the error for debugging
                return res.status(500).send('Internal Server Error'); // Send a 500 error response
            }

            // Check if results are empty
            if (results.length === 0) {
                return res.status(404).send('User  not found'); // Handle case where user is not found
            }

            // Render the profile page and pass the user data and isAdmin flag
            res.render('profile-page', {
                id: results[0].id,
                firstName: results[0].firstName,
                middleName: results[0].middleName,
                lastName: results[0].lastName,
                email: results[0].email,
                phone: results[0].phone,
                isAdmin // Pass the isAdmin flag
            });
        });
});

// Render sales-tracker
newapp2.get('/track-sales.html', ensureAuthenticated, (req, res) => {
    const sqlQuery = `
    SELECT *, (SELECT COUNT(*) FROM sell_images) AS count 
    FROM sell_images`; 

    connection.query("SELECT * FROM all_properties", (err, card) => {
        if (err) {
            console.error(err.message);
        }

    connection.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('Error fetching sell images:', err.message);
            return res.status(500).send('Database query error.');
        }
        else{
            
            res.render('All_properties', {
                card,
               
            });
        }
    });
    })
});


// Navigation ends

// Need to sign in
newapp2.get('/register.html', (req, res) => {
    res.render('signin-page');
});

// Route for selling a property
newapp2.post('/upload', upload.fields([
    { name: 'image', maxCount: 10 },  // max 10 images
    { name: 'video', maxCount: 5 }    // max 5 videos
]), (req, res) => {
    const {
        ownerName, ownerEmail, ownerPhone, propertyAddress,
        bedrooms, bathrooms, sqft, description, title,
        rentSell, amount, property_type
    } = req.body;

    // Extract image paths from req.files.image (array) if exists
    const imagePaths = req.files.image ? req.files.image.map(file => file.path).join(',') : '';

    // Extract video paths from req.files.video (array) if exists
    const videoPaths = req.files.video ? req.files.video.map(file => file.path).join(',') : '';

    // SQL Insert statement
    const sql = `
        INSERT INTO sales_approval 
        (ownerName, ownerEmail, ownerPhone, propertyAddress, bedrooms, bathrooms, sqft, image_data, video, description, title, rentSell, amount, property_type) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        ownerName, ownerEmail, ownerPhone, propertyAddress,
        bedrooms, bathrooms, sqft, imagePaths, videoPaths,
        description, title, rentSell, amount, property_type
    ];

    connection.query(sql, values, (err) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).send('Error inserting data: ' + err.message);
        }
        res.render('sell-uploaded-successfully');
    });
});

// Sales progress before sending to admin
newapp2.get('/sales-completed', (req, res) => {
    // Check if the user is logged in
    if (!req.user) {
        return res.redirect('/login');
    }

    const userEmail = req.user.email; // Get the user email from the session

    // Determine if the user is an admin based on their email
    const isAdmin = userEmail === 'ibarealestate2023@gmail.com';

    connection.query("SELECT * FROM sell_images", (err, card) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        } else {
            // Pass the card data and isAdmin flag to the index template
            res.render('sell-page', {
                card,
                isAdmin // Pass the isAdmin flag
            });
        }
    });
});




newapp2.get('/sales-approved', (req, res) => {
    // Ensure req.user exists (authentication middleware should set this)
    if (!req.user) {
        return res.status(401).send('Unauthorized');
    }

    const userId = req.user.id; 
    const userEmail = req.user.email;

    // Query to get the user's details from the signin database
    const sqlSelect = `SELECT * FROM signin WHERE id = ?`;
    connection.query(sqlSelect, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user:', err.message);
            return res.status(500).send('Server error');
        }

        if (results.length === 0) {
            return res.status(404).send('User  not found');
        }

        const user = results[0];

        // Determine if the user is an admin based on their email
        const isAdmin = userEmail === 'ibarealestate2023@gmail.com';

        // Query to get all signin records (or change to your intended table)
        connection.query("SELECT * FROM signin", (err, card) => {
            if (err) {
                console.error('Error fetching signin records:', err.message);
                return res.status(500).send('Server error');
            }

            // Render the 'sales-approval' view and pass data
            return res.render('sales-approval', { 
                card, 
                isAdmin, 
                userId: user.id,
                userEmail: user.email
            });
        });
    });
});

newapp2.get('/sales-declined', (req, res) => {
    const userId = req.user.id; // Get the user ID from the session
    const userEmail = req.user.email; // Get the user email from the session
    

    // Query to get the user's details from the signin database
    const sqlSelect = `SELECT * FROM signin WHERE id = ?`;
    connection.query(sqlSelect, [userId], (err, results) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        }

        if (results.length > 0) {
            const user = results[0]; // Get the user details

            // Determine if the user is an admin based on their email
            const isAdmin = userEmail === 'ibarealestate2023@gmail.com';
    connection.query("SELECT * FROM signin ", (err, card) => {
        if (err) {
            console.error(err.message);
        } else {
            res.render('sales-approval', { card ,isAdmin, // Pass the isAdmin flag
                userId: user.id,
                userEmail: user.email,});
        }
    });
}
    });
});


// Request tour
newapp2.get('/request-tour', (req, res) => {
    const propertyId = req.query.id; // Get the ID from the query parameters
    // Check if the ID is provided
    if (!propertyId) {
        return res.status(400).send('Property ID is required.');
    }
    const userId = req.user.id; // Get the user ID from the session
    const userEmail = req.user.email; // Get the user email from the session
    

    // Query to get the user's details from the signin database
    const sqlSelect = `SELECT * FROM signin WHERE id = ?`;
    connection.query(sqlSelect, [userId], (err, results) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        }

        if (results.length > 0) {
            const user = results[0]; // Get the user details

            // Determine if the user is an admin based on their email
            const isAdmin = userEmail === 'ibarealestate2023@gmail.com';
            const propertyId = req.query.id;
    // Query the database for the specific property
    connection.query("SELECT * FROM sell_images WHERE id = ?", [propertyId], (err, card) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Database query error.');
        }
        // Check if any property was found
        if (card.length > 0) {
            // Render the request-toutour page with the property data
            res.render('request-tour', { property: card[0] ,isAdmin, // Pass the isAdmin flag
                userId: user.id,
                userEmail: user.email}); // Pass the property data to the template
        } else {
            res.status(404).send('No property found with that ID.');
        }
    });
}
    });
});



newapp2.get('/view', ensureAuthenticated, (req, res) => {
     // Get the ID from the query parameters
    // Check if the user is logged in
    if (!req.user) {
        return res.status(401).send('Unauthorized: Please log in first.');
    }

    const userId = req.user.id; // Get the user ID from the session
    const userEmail = req.user.email; // Get the user email from the session
    

    // Query to get the user's details from the signin database
    const sqlSelect = `SELECT * FROM signin WHERE id = ?`;
    connection.query(sqlSelect, [userId], (err, results) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        }

        if (results.length > 0) {
            const user = results[0]; // Get the user details

            // Determine if the user is an admin based on their email
            const isAdmin = userEmail === 'ibarealestate2023@gmail.com';
            const propertyId = req.query.id;
            // Query the database for the specific property
    connection.query("SELECT * FROM sales_approval WHERE id = ?", [propertyId], (err, card) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).send('Database query error.');
                } else {
                    if (card.length > 0) {
                        // Render the request-tour page with the property data
                    res.render('request-tour', {
                        property: card[0],
                        isAdmin, // Pass the isAdmin flag
                        userId: user.id,
                        userEmail: user.email
                    });
                    
                }
                else {
                    res.status(404).send('No property found with that ID.');
                }
                }
            });
        } else {
            return res.status(404).send('User  not found');
        }
    });
});

// Submit tour route
newapp2.post('/submit-tour', (req, res) => {
    const { name, email, phone, date, time } = req.body;
    // Insert data into the database
    const sql = 'INSERT INTO request_tour (name, email, phone, date, time) VALUES (?, ?, ?, ?, ?)';
    const values = [name, email, phone, date, time];
    connection.query(sql, values, (err) => {
        if (err) {
            return res.status(500).send('Error inserting data: ' + err);
        }
        res.render('tour-submitted');
    });
});

// Tour submitted route
newapp2.get('/tour-submitted', (req, res) => {
    const userId = req.user.id; // Get the user ID from the session
    const userEmail = req.user.email; // Get the user email from the session
    

    // Query to get the user's details from the signin database
    const sqlSelect = `SELECT * FROM signin WHERE id = ?`;
    connection.query(sqlSelect, [userId], (err, results) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        }

        if (results.length > 0) {
            const user = results[0]; // Get the user details

            // Determine if the user is an admin based on their email
            const isAdmin = userEmail === 'ibarealestate2023@gmail.com';
            const propertyId = req.query.id;
    connection.query("SELECT * FROM sell_images", (err, card) => {
        if (err) {
            console.error(err.message);
        } else {
            res.render('index', { card,isAdmin, // Pass the isAdmin flag
                userId: user.id,
                userEmail: user.email, });
        }
    });
}
    });
});

// Save home improvement into the database
newapp2.post('/improvement-request-form', (req, res) => {
    const { name, email, phone, message } = req.body;
    // Insert data into the database
    const sql = 'INSERT INTO homeImprovement (name, email, phone, message) VALUES (?, ?, ?, ?)';
    const values = [name, email, phone, message];
    connection.query(sql, values, (err) => {
        if (err) {
            return res.status(500).send('Error inserting data: ' + err);
        }
        res.render('tour-submitted');
    });
}); 


//edit profile rout
newapp2.get('/edit-profile', (req, res) => {
    const userId = req.user.id; // Get the user ID from the session
    const userEmail = req.user.email; // Get the user email from the session

      // Query to get the user's details from the signin database
      const sqlSelect = `SELECT * FROM signin WHERE id = ?`;
      connection.query(sqlSelect, [userId], (err, results) => {
          if (err) {
              console.error(err.message);
              return res.status(500).send('Server error');
          }
  
          if (results.length > 0) {
              const user = results[0]; // Get the user details
  
              // Determine if the user is an admin based on their email
              const isAdmin = userEmail === 'ibarealestate2023@gmail.com';

              res.render('setting-page', { isAdmin, // Pass the isAdmin flag
                 });
        
    
          }
          });
});

// Update profile route
newapp2.post('/update-profile', (req, res) => {
    const { firstName, middleName, lastName, email, phone, currentPassword } = req.body;
    const userId = req.user.id; // Assuming user is authenticated

    // Fetch the current user's hashed password from the database
    connection.query('SELECT confirmPassword FROM signin WHERE id = ?', [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error fetching user data');
        }

        if (results.length === 0) {
            return res.status(404).send('User  not found');
        }

        const hashedPassword = results[0].confirmPassword;

        // Compare the entered password with the hashed password
        if (!bcrypt.compareSync(currentPassword, hashedPassword)) {
            return res.status(401).send('Current password is incorrect'); // Unauthorized
        }

        // If the password matches, update the user data
        const sql = `UPDATE signin 
                     SET firstName = ?, middleName = ?, lastName = ?, email = ?, phone = ?
                     WHERE id = ?`;
        
        connection.query(sql, [firstName, middleName, lastName, email, phone, userId], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error updating profile');
            }
            res.redirect('/profile-page.html'); // Redirect to profile page after update
        });
    });
});


// Route to send message
newapp2.post('/message', (req, res) => {
    console.log('Request body:', req.body); // Log the entire request body

    // Validate message input
    const message = req.body.message;
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Invalid message format' });
    }

    const userId = req.user.id;
    console.log('Received message:', message);
    console.log('User  ID:', userId);

    // Retrieve user details from the database
    connection.query('SELECT firstName, email FROM signin WHERE id = ?', [userId], (error, results) => {
        if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'User  not found' });
        }

        const user = results[0];

        // Email options
        const mailOptions = {
            from: user.email,
            to: 'ibarealestate2023@gmail.com', // Creator's email
            subject: `New Message from ${user.firstName}`,
            text: message,
            html: `<p><strong>From:</strong> ${user.firstName} (${user.email})</p><p><strong>Message:</strong></p><p>${message}</p>`,
        };

        // Send email
        transporter.sendMail(mailOptions, (err) => {
            if (err) {
                console.error('Error sending email:', err);
                return res.status(500).json({ error: 'Failed to send message' });
            }
            res.status(200).json({ success: true, message: 'Message sent successfully' });
        });
    });
});


// sales approve route
newapp2.get('/approve', (req, res) => {
    const propertyId = req.query.id; // Get the ID from query

    // Check if the ID is provided
    if (!propertyId) {
        return res.status(400).send('Property ID is required.');
    }

    // Query the database for the specific property
    connection.query(
        "SELECT * FROM sales_approval WHERE id = ?",
        [propertyId],
        (err, results) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Database query error.');
            }

            // Check if any property was found
            if (results.length === 0) {
                return res.status(404).send('No property found with that ID.');
            }

            const property = results[0];

            // Insert the property into the sell_images table
           const sqlInsertSell = `
    INSERT INTO sell_images 
    (ownerName, ownerEmail, ownerPhone, propertyAddress, bedrooms, bathrooms, sqft, image_data, video, description, title, rentSell, amount, \`property-type\`) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
            connection.query(
                sqlInsertSell,
                [
                    property.ownerName,
                    property.ownerEmail,
                    property.ownerPhone,
                    property.propertyAddress,
                    property.bedrooms,
                    property.bathrooms,
                    property.sqft,
                    property.image_data,
                    property.video,
                    property.description,
                    property.title,
                    property.rentSell,
                    property.amount,
                    property.property_type
                ],
                (err) => {
                    if (err) {
                        console.error(err.message);
                        return res.status(500).send('Error inserting into sell_images.');
                    }

                    const status = 'Active';

                    // Insert into all_properties
                    const sqlInsertAll = `
                        INSERT INTO all_properties 
                        (properties_id, Status, properties_address, owners_name, proper_amount, owner_email) 
                        VALUES (?, ?, ?, ?, ?, ?)
                    `;
                    connection.query(
                        sqlInsertAll,
                        [
                            propertyId,
                            status,
                            property.propertyAddress,
                            property.ownerName,
                            property.amount,
                            property.ownerEmail
                        ],
                        (err) => {
                            if (err) {
                                console.error(err.message);
                                return res.status(500).send('Error inserting into all_properties.');
                            }

                            // Insert the amount into the total_amount table
                            const sqlInsertTotal = `INSERT INTO total_amount (amount) VALUES (?)`;
                            connection.query(
                                sqlInsertTotal,
                                [property.amount],
                                (err) => {
                                    if (err) {
                                        console.error(err.message);
                                        return res.status(500).send('Error inserting into total_amount.');
                                    }

                                    // Now delete the property from the sales_approval table
                                    const sqlDelete = `DELETE FROM sales_approval WHERE id = ?`;
                                    connection.query(sqlDelete, [propertyId], (err) => {
                                        if (err) {
                                            console.error(err.message);
                                            return res.status(500).send('Error deleting from sales_approval.');
                                        }

                                        return res.render('sales-approved-successfully');
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});



//decline sales route
newapp2.get('/decline', (req, res) => {
    const propertyId =  req.query.id; // Get the ID from the request body
    
    // Check if the ID is provided
    if (!propertyId) {
        return res.status(400).send('Property ID is required.');
    }

    // Query the database for the specific property
    connection.query("SELECT * FROM sales_approval WHERE id = ?", [propertyId], (err, results) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Database query error.');
        }

        // Check if any property was found
        if (results.length > 0) {
            const property = results[0];
            
                // Now delete the property from the sales_approval table
                const sqlDelete = `DELETE FROM sales_approval WHERE id = ?`;
                connection.query(sqlDelete, [propertyId], (err, deleteResults) => {
                    if (err) {
                        console.error(err.message);
                        return res.status(500).send('Error deleting from sales_approval.');
                    }

                    return res.render('sales-declined-successfully');
                });
        }
        
    });
});



// Route to fetch customer details
newapp2.get('/view-customers.html', (req, res) => {
    const userId = req.user.id; // Get the user ID from the session
    const userEmail = req.user.email; // Get the user email from the session

      // Query to get the user's details from the signin database
      const sqlSelect = `SELECT * FROM signin WHERE id = ?`;
      connection.query(sqlSelect, [userId], (err, results) => {
          if (err) {
              console.error(err.message);
              return res.status(500).send('Server error');
          }
  
          if (results.length > 0) {
              const user = results[0]; // Get the user details
  
              // Determine if the user is an admin based on their email
              const isAdmin = userEmail === 'ibarealestate2023@gmail.com';
    const sqlQuery = `
        SELECT id, firstName, middleName, email, phone, 
               (SELECT COUNT(*) FROM signin) AS count 
        FROM signin`; // Adjust the query as per your table structure

    connection.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('Error fetching customer data:', err);
            return res.status(500).send('Database query error.');
        }

        // Get the count from the result
        const rowCount = results.length > 0 ? results[0].count : 0; // Ensure there's at least one result

        // Render the customer management page with the fetched data
        res.render('customers', { customers: results, rowCount ,isAdmin, // Pass the isAdmin flag
            userId: user.id,
            userEmail: user.email,rowCount  });
    });
}
      });
});


// Route to approve a tour request
newapp2.get('/approve-tour', (req, res) => {

    const tourId = req.query.id;
    // Fetch the tour details to get the email
    connection.query('SELECT * FROM request_tour WHERE id = ?', [tourId], (err, results) => {
        if (err) {
            console.error('Error fetching tour details:', err);
            return res.status(500).send('Database query error.');
        }

        if (results.length === 0) {
            return res.status(404).send('Tour not found.');
        }

        const tour = results[0];

        // Send email notification
        const mailOptions = {
            from: 'your-email@gmail.com',
            to: tour.email,
            subject: 'Tour Request Approved',
            text: `Dear ${tour.name},\n\nYour tour request has been approved.\n\nBest regards,\nIba Real Estate`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).send('Error sending email.');
            }

            // Delete the tour request from the database
            connection.query('DELETE FROM request_tour WHERE id = ?', [tourId], (err) => {
                if (err) {
                    console.error('Error deleting tour request:', err);
                    return res.status(500).send('Database query error.');
                }

                
               return res.render('tour-approved-successfully');
            });
        });
    });
});

// Route to decline a tour request
newapp2.get('/decline-tour', (req, res) => {
    const tourId = req.query.id;

    // Fetch the tour details to get the email
    connection.query('SELECT * FROM request_tour WHERE id = ?', [tourId], (err, results) => {
        if (err) {
            console.error('Error fetching tour details:', err);
            return res.status(500).send('Database query error.');
        }

        if (results.length === 0) {
            return res.status(404).send('Tour not found.');
        }

        const tour = results[0];

        // Send email notification
        const mailOptions = {
            from: 'your-email@gmail.com',
            to: tour.email,
            subject: 'Tour Request Declined',
            text: `Dear ${tour.name},\n\nYour tour request has been declined.\n\nBest regards,\nIba Real Estate`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).send('Error sending email.');
            }

            // Delete the tour request from the database
            connection.query('DELETE FROM request_tour WHERE id = ?', [tourId], (err) => {
                if (err) {
                    console.error('Error deleting tour request:', err);
                    return res.status(500).send('Database query error.');
                }

               
               return res.render('tour-declined-successfully');
            });
        });
    });
});


// route for successful tour approval
newapp2.get('/tour-approved-successfully', (req, res) => {
    const userId = req.user.id; // Get the user ID from the session
    const userEmail = req.user.email; // Get the user email from the session
    

    // Query to get the user's details from the signin database
    const sqlSelect = `SELECT * FROM signin WHERE id = ?`;
    connection.query(sqlSelect, [userId], (err, results) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        }

        if (results.length > 0) {
            const user = results[0]; // Get the user details

            // Determine if the user is an admin based on their email
            const isAdmin = userEmail === 'ibarealestate2023@gmail.com';
      
            // Query the database for the specific property
    const sqlQuery = `
    SELECT *, (SELECT COUNT(*) FROM request_tour) AS count 
    FROM request_tour`; // Adjust the query as per your table structure

connection.query(sqlQuery, (err, results) => {
    if (err) {
        console.error('Error fetching tour requests:', err.message);
        return res.status(500).send('Database query error.');
    }

    // Get the count from the result
    const rowCount = results.length > 0 ? results[0].count : 0; // Ensure there's at least one result

    // Render the requested tour page with the fetched data
    res.render('requested-tour', { card: results, isAdmin, // Pass the isAdmin flag
        userId: user.id,
        userEmail: user.email,rowCount });
});
}
    }); 
});



// route for successful tour approval
newapp2.get('/tour-declined-successfully', (req, res) => {
    const userId = req.user.id; // Get the user ID from the session
    const userEmail = req.user.email; // Get the user email from the session
    

    // Query to get the user's details from the signin database
    const sqlSelect = `SELECT * FROM signin WHERE id = ?`;
    connection.query(sqlSelect, [userId], (err, results) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        }

        if (results.length > 0) {
            const user = results[0]; // Get the user details

            // Determine if the user is an admin based on their email
            const isAdmin = userEmail === 'ibarealestate2023@gmail.com';
         

    const sqlQuery = `
    SELECT *, (SELECT COUNT(*) FROM request_tour) AS count 
    FROM request_tour`; // Adjust the query as per your table structure

connection.query(sqlQuery, (err, results) => {
    if (err) {
        console.error('Error fetching tour requests:', err.message);
        return res.status(500).send('Database query error.');
    }

    // Get the count from the result
    const rowCount = results.length > 0 ? results[0].count : 0; // Ensure there's at least one result

    // Render the requested tour page with the fetched data
    res.render('requested-tour', { card: results, rowCount,isAdmin, // Pass the isAdmin flag
        userId: user.id,
        userEmail: user.email,rowCount  });
});
}
    });
});


newapp2.get('/search', ensureAuthenticated, (req, res) => {
    if (!req.user) {
        return res.status(401).send('Unauthorized: Please log in first.');
    }

    const userEmail = req.user.email;
    const isAdmin = userEmail === 'ibarealestate2023@gmail.com';

    // Extract search query parameters
    const { location, min_price, max_price, min_beds, min_baths } = req.query;

    // Start SQL query
    let sql = "SELECT * FROM sell_images WHERE 1=1";
    let values = [];

    // Add filters dynamically
    if (location) {
        sql += " AND propertyAddress LIKE ?";
        values.push(`%${location}%`);
    }
    if (min_price) {
        sql += " AND amount >= ?";
        values.push(min_price);
    }
    if (max_price) {
        sql += " AND amount <= ?";
        values.push(max_price);
    }
    if (min_beds) {
        sql += " AND bedrooms >= ?";
        values.push(min_beds);
    }
    if (min_baths) {
        sql += " AND bathrooms >= ?";
        values.push(min_baths);
    }

    // Run query
    connection.query(sql, values, (err, card) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        }
        res.render('index', {
            card,
            isAdmin
        });
    });
});


// Buy Search Route
newapp2.get('/buy-search-form', ensureAuthenticated, (req, res) => {
    if (!req.user) {
        return res.status(401).send('Unauthorized: Please log in first.');
    }

    const userEmail = req.user.email;
    const isAdmin = userEmail === 'ibarealestate2023@gmail.com';

    // Extract query params from form
    const { location,  min_price,  max_price,  min_beds,  min_baths } = req.query;

    // Base query
    let query = "SELECT * FROM sell_images WHERE rentSell = 'sell'";
    let queryParams = [];

    // Apply filters if provided
    if (location && location.trim() !== '') {
        query += " AND propertyAddress LIKE ?";
        queryParams.push(`%${location}%`);
    }
    if (min_price && !isNaN(min_price)) {
        query += " AND amount >= ?";
        queryParams.push(parseInt(minPrice));
    }
    if (max_price && !isNaN(max_price)) {
        query += " AND amount <= ?";
        queryParams.push(parseInt(max_price));
    }
    if (min_beds && !isNaN(min_beds)) {
        query += " AND bedrooms >= ?";
        queryParams.push(parseInt(min_beds));
    }
    if (min_baths && !isNaN(min_baths)) {
        query += " AND bathrooms >= ?";
        queryParams.push(parseInt(min_baths));
    }

    // Run the query
    connection.query(query, queryParams, (err, card) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        }

        // Render same buy-page with filtered results
        res.render('buy-page', {
            card,
            isAdmin
        });
    });
});


// customer Sell page
newapp2.get('/customer-buy-page.html', (req, res) => {
 

    // Determine if the user is an admin based on their email
    

    connection.query("SELECT * FROM sell_images", (err, card) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        } else {
            // Pass the card data and isAdmin flag to the sell-page template
            res.render('customer-buy-page', {
                card,
              
            });
        }
    });
});

newapp2.get('/costumer-sell-page.html', (req, res) => {
 

    // Determine if the user is an admin based on their email
    

    connection.query("SELECT * FROM sell_images", (err, card) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        } else {
            // Pass the card data and isAdmin flag to the sell-page template
            res.render('customer-sell-page', {
                card,
              
            });
        }
    });
});

newapp2.get('/customer-rent-page.html', (req, res) => {
 

    // Determine if the user is an admin based on their email
    

    connection.query("SELECT * FROM sell_images", (err, card) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        } else {
            // Pass the card data and isAdmin flag to the sell-page template
            res.render('customer-rent-page', {
                card,
              
            });
        }
    });
});


// propert details
newapp2.get('/property-detail', (req, res) => {
  const propertyId = req.query.id;
  if (!propertyId) return res.status(400).send('Property ID is required.');

  if (!req.user) return res.redirect('/login');

  const isAdmin = req.user.email === 'ibarealestate2023@gmail.com';

  connection.query("SELECT * FROM sell_images WHERE id = ?", [propertyId], (err, results) => {
    if (err) return res.status(500).send('Database query error.');
    if (results.length === 0) return res.status(404).send('No property found with that ID.');

    res.render('view-details', {
      property: results[0],
      isAdmin,
      userId: req.user.id,
      userEmail: req.user.email
    });
  });
});

//contact form

newapp2.post('/contact', ensureAuthenticated,(req, res) => {
    const { name, email, phone, subject, message } = req.body;
    
    // Basic validation
    if (!name || !email || !phone || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Email options
    const mailOptions = {
        from: email, // Sender's email
        to: 'admin@yourdomain.com', // Admin's email (replace with actual)
        subject: `Contact Form: ${subject || 'New Inquiry'}`,
        html: `
            <h2>IBA REAL ESTATE CONTACT MESSAGE</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
            <hr>
            <p>This email was sent from your Iba real estate website contact form.</p>
        `
    };
       connection.query("SELECT * FROM sell_images LIMIT 3" , (err, card) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        } 
    
    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Email error:', error);
            return res.status(500).json({ error: 'Failed to send email. Please try again.' });
        } 
            console.log('Email sent:', info.response);
            return res.redirect('/',{card});
        
    });
});
});


newapp2.get('/property-detail.html', (req, res) => {
    res.render('login');
});


newapp2.post('/detail-contact', ensureAuthenticated,(req, res) => {
    const { name, email, phone, message } = req.body;
    const subject = "Propert Enquiry";
    // Basic validation
    if (!name || !email || !phone || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Email options
    const mailOptions = {
        from: email, // Sender's email
        to: 'admin@yourdomain.com', // Admin's email (replace with actual)
        subject: `Contact Form: ${subject || 'New Inquiry'}`,
        html: `
            <h2>IBA REAL ESTATE CONTACT MESSAGE</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
          
            <p><strong>Message:</strong></p>
            <p>${message}</p>
            <hr>
            <p>This email was sent from your Iba real estate website detail form.</p>
        `
    };
       connection.query("SELECT * FROM sell_images LIMIT 3" , (err, card) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server error');
        } 
    
    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Email error:', error);
            return res.status(500).json({ error: 'Failed to send email. Please try again.' });
        } 
        
            console.log('Email sent:', info.response);
            return res.redirect('/',{card});
            
        
    });
});
});

// Start the server
newapp2.listen(8000, () => {
    newapp2.timeout = 0;
    console.log('IBA Real Estate Server is running at port 8000');
});


//NOTES
// CREATE SEARCH BUTTON
//NAVIGATION FROM ONE TWO
//