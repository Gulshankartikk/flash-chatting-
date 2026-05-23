const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/dbConnect');
const bodyParser = require('body-parser');
const authRoute = require('./routes/authRoute');
const chatRoute =require('./routes/chatRoute')

dotenv.config();

const PORT = process.env.PORT || 8000;
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Database connection
connectDB();

// Routes
app.use('/api/auth', authRoute); // ✅ FIXED
app.use('/api/chat',chatRoute)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
