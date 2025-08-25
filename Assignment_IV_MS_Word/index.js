require('dotenv').config();
const express = require('express');
const app = express();
const dbConnection = require('./app/config/dbConnect');
const ApiRoutes = require('./app/router/ApiRouter/UserRouter');
const PostRoutes = require("./app/router/ApiRouter/PostRouter");
const categoryRoutes = require("./app/router/ApiRouter/CategoriesRouter");
const commentRoutes = require("./app/router/ApiRouter/CommentRouter");
const cookieParser = require('cookie-parser');
const path = require("path");

dbConnection()



app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(express.static(path.join(__dirname, "uploads")));
app.use("/uploads", express.static("uploads"));

app.use('/api', ApiRoutes);
app.use("/api/post", PostRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/comments", commentRoutes);

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
