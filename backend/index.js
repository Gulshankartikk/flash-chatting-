const dotenv = require('dotenv');
dotenv.config(); // ← SABSE PEHLE, koi bhi require se pehle

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/dbConnect');
const bodyParser = require('body-parser');
const authRoute = require('./routes/authRoute');      // ← twilioService yahan load hota hai
const chatRoute = require('./routes/chatRoute');
const statusRoute = require('./routes/statusRoutes');
const http = require('http');
const initilizeSocket = require('./services/socketService');

const PORT = process.env.PORT || 8000;
const app = express();

const corsOption = {
    origin: process.env.FRONTEND_URL,
    credentials: true,
};

app.use(cors(corsOption));

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = initilizeSocket(server);

app.use((req, res, next) => {
    req.io = io;
    req.socketUserMap = io.socketUserMap;
    next();
});

connectDB();

app.use('/api/auth', authRoute);
app.use('/api/chat', chatRoute);
app.use('/api/status', statusRoute);

const authMiddleware = require('./middleware/authMiddleware');
const authController = require('./controllers/authController');
app.patch('/api/users/:id/status', authMiddleware, authController.updateUserStatus);

// ✅ server.listen, NOT app.listen — this is the server socket.io is attached to
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});