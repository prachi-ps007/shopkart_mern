const express = require("express")
const mongoose = require("mongoose")
const app = express()
const dotenv = require("dotenv")
dotenv.config()

const customerRoute = require("./routes/customer.routes.js")
const productRoute = require("./routes/product.routes.js")
const wishlistRoute = require("./routes/wishlist.routes.js")
const cartRoute = require("./routes/cart.routes.js")
const orderRoutes = require("./routes/order.routes.js")
const cookieParser = require("cookie-parser")
const cors = require("cors")


mongoose.connect(process.env.dbUrl).then(() => {
    console.log("Database connected")
}).catch((err) => {
    console.log("Database connection failed", err)
})

app.use(express.json())
app.use(cookieParser())
app.use(cors(
    {
        origin: "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    }
))

app.use("/customers", customerRoute)
app.use("/products", productRoute)
app.use("/wishlist", wishlistRoute)
app.use("/cart", cartRoute)
app.use("/orders", orderRoutes)
app.get("/", (req,res) => {
    res.send("SERVER CREATED")
})

app.listen(8080, () => {
    console.log("Server is running on port 8080")
})

