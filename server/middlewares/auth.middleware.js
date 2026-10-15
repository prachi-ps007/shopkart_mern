const jwt = require("jsonwebtoken")
const Customer = require("../models/customer.model.js")

const isAuthenticated = async(req,res,next) => {
    try{
        const token = req.cookies.token
        
        if (!token) {
            return res.status(401).json({
                message: "Authentication required"
            })
        }
        
        const decoded = jwt.verify(token, process.env.JWT_secret)
        const customer = await Customer.findById(decoded.userId)

        if (!customer) {
            return res.status(404).json({
                message: "Customer not found"
            })
        }
        req.customer = customer

        next()

    }
    catch(err){
        console.log(err)
    }
}

module.exports = {isAuthenticated}

