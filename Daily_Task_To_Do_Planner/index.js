require('dotenv').config();
const express = require('express');
const app = express();
const dbConnection = require('./app/config/dbConnect');
const ApiRoutes = require('./app/router/ApiRouter/UserRouter');
const CategoryRoutes = require("./app/router/ApiRouter/CategoriesRouter");
const TaskRoutes = require("./app/router/ApiRouter/TaskRouter");
const LabelRoutes = require("./app/router/ApiRouter/LabelRouter");
const ReminderRoutes = require("./app/router/ApiRouter/ReminderRouter");
const ReportRoutes = require("./app/router/ApiRouter/ReportRouter");
const cookieParser = require('cookie-parser');
const path = require("path");

dbConnection()



app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(express.static(path.join(__dirname, "uploads")));
app.use("/uploads", express.static("uploads"));

app.use('/api', ApiRoutes);
app.use('/api', CategoryRoutes);
app.use('/api', TaskRoutes);
app.use('/api', LabelRoutes);
app.use('/api', ReminderRoutes);
app.use('/api', ReportRoutes);


const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
