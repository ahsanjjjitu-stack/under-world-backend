require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");

const { initSocket } = require("./config/socket");



app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));




const server = http.createServer(app);

initSocket(server);




mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((error) => {
        console.error("Error connecting to MongoDB:", error);
    });


    


app.use("/api", require("./routers/authRoutes"));
app.use("/api", require("./routers/homeRoutes"));
app.use("/api", require("./routers/productRoutes"));
app.use("/api", require("./routers/cartRoutes"));
app.use("/api", require("./routers/orderRoutes"));






const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server is running on port at http://localhost:${port}`);
});