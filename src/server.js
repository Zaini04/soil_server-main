const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const {connectDB} = require('./utils/db');
const cors = require('cors');
const path = require('path');
const app = express();
const http = require('http');
const cookieParser = require("cookie-parser");
const loggingMiddlewares = require("./middlewares/loggingMiddlewares.js");

connectDB();

const allowedOrigins = process.env.ALLOWED_ORIGINS;
const corsOptions = {
    origin : function (origin , callback ) {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null , true)
        }else {
            callback(new Error('Not allowed by cors.'))
        }  
    } ,
    optionsSuccessStatus: 200,
    credentials: true,
}

// MIDDLEWARES
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json({ limit : '100mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname , 'uploads')));
app.use(mongoSanitize());

// ROUTES
app.use('/api/user' , require('./routes/userRoutes'));
app.use('/api/vehicle',require('./routes/vehicleRoutes'))
app.use('/api/entry-vehicle',require('./routes/entryVehicleRoutes'))
app.use('/api/client',require('./routes/clientRoutes'))
app.use('/api/fuel',require('./routes/fuelRoutes'))
app.use('/api/site',require('./routes/siteRoutes'))
app.use('/api/project' , require('./routes/projectRoutes'));
app.use('/api/sector' , require('./routes/sectorRoutes'));
app.use('/api/inventory' , require('./routes/inventoryRoutes'));

app.use("/", loggingMiddlewares.respondNoResourceFound);

// GLOBAL ERROR HANDLER
app.use("/", require("./middlewares/errorHandler"));


module.exports = app;

// initialize scoket
if (process.env.NODE_ENV !== "production") {
const server = http.createServer(app);

const PORT = process.env.PORT || 4949;
server.listen(PORT , () => console.log(`Server is listening on port ${PORT}`));


// GRACEFULLY SHUTDOWN
const gracefulShutdown = async () => {
    console.log('Gracefully shutting down...');
    server.close(() => {
        console.log('Server closed successfully. Process terminated!');
        process.exit(0);
    });
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
}