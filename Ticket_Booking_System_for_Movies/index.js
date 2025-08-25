require('dotenv').config();
const express = require('express');
const app = express();
const dbConnection = require('./app/config/dbConnect');
const ApiRoutes = require('./app/router/ApiRouter/UserRouter');
const AdminApiRoutes = require('./app/router/ApiRouter/AdminRouter');
const BookingApiRoutes = require('./app/router/ApiRouter/BookingRouter')
const ReportApiRoutes = require('./app/router/ApiRouter/ReportRouter')
const cookieParser = require('cookie-parser');
const path = require("path");



dbConnection()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(express.static(path.join(__dirname, "uploads")));
app.use("/uploads", express.static("uploads"));

app.use('/api', ApiRoutes);
app.use('/api/movies', AdminApiRoutes);
app.use('/api/movies', BookingApiRoutes);
app.use('/api/reports', ReportApiRoutes);

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
