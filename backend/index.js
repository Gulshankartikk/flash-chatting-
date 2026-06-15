const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/dbConnect');
const bodyParser = require('body-parser');
const authRoute = require('./routes/authRoute');
const chatRoute =require('./routes/chatRoute')
const statusRoute =require('./routes/statusRoutes')
const http =require('http')
const initilizeSocket =require('./services/socketService')

dotenv.config();

const PORT = process.env.PORT || 8000;
const app = express();


const corsOption  ={
    origin:process.env.FRONTEND_URL,
    Credentials:true
}

app.use(cors(corsOption))

// Middleware
app.use(express.json()); // parser body data
app.use(cookieParser());// parser token on every request
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

//create server
const server = http.createServer(app)
const io = initilizeSocket(server)

//apply coket middleware before routes
app.use((req,res,next)=>{
    req.io =io;
    req.socketUserMap =io.socketUserMap
    next();
})


// Database connection
connectDB();

// Routes
app.use('/api/auth', authRoute); // ✅ FIXED
app.use('/api/chat',chatRoute)
app.use('/api/status',statusRoute)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
