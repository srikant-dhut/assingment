require('dotenv').config();
const express = require('express');
const app = express();
const dbConnection = require('./app/config/dbConnect');
const UserRoutes = require('./app/router/ApiRouter/UserRouter');
const CourseRoutes = require('./app/router/ApiRouter/CourseRouter');
const BatchRoutes = require('./app/router/ApiRouter/BatchRouter');
const AttendanceRoutes = require('./app/router/ApiRouter/AttendanceRouter');
const ExamRoutes = require('./app/router/ApiRouter/ExamRouter');
const EnrollmentRoutes = require('./app/router/ApiRouter/EnrollmentRouter');
const ReportRoutes = require('./app/router/ApiRouter/ReportRouter');
const cookieParser = require('cookie-parser');
const path = require("path");

dbConnection()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(express.static(path.join(__dirname, "uploads")));
app.use("/uploads", express.static("uploads"));

// API Routes
app.use('/api/users', UserRoutes);
app.use('/api/courses', CourseRoutes);
app.use('/api/batches', BatchRoutes);
app.use('/api/attendance', AttendanceRoutes);
app.use('/api/exams', ExamRoutes);
app.use('/api/enrollments', EnrollmentRoutes);
app.use('/api/reports', ReportRoutes);

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Institute Management System running on http://localhost:${port}`);
});
