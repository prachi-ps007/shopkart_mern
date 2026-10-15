const Customer = require("../models/customer.model.js")
const bcrypt = require("bcrypt")
const genToken = require("../utils/generateToken.js")

const cookieOptions = {
    httpOnly: true
}

const registerCustomer = async(req,res) => {
    try{
        const {fullName, email, password , phone} = req.body

        if(!fullName || !email || !password || !phone){
            return res.status(400).json({message: "All fields are required"})
        }

        if(password.length<6){
            return res.status(400).json({message: "Password must contain at least 6 characters"})
        }

        const existingCustomer = await Customer.findOne({email})
        if(existingCustomer){
            return res.status(409).json({message: "Email already exists"})
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)


        const customer = await Customer.create({
                fullName,
                email,
                password : hashedPassword,
                phone,
        })

        const token = genToken(customer._id)
        res.cookie("token", token, cookieOptions )


        return res.status(201).json({success: true, message: "Customer registered successfully", customer})
    } catch (err){
        console.log(err)

        return res.status(500).json({message: "Internal server error"})
    }
}


const loginCustomer = async(req,res) => {
    try{
        const {email,password} = req.body 

        if(!email || !password){
            return res.status(400).json({message:"Email and password are required"})
        }
        const userExists = await Customer.findOne({email})
        if(!userExists){
            return res.status(404).json({message:"User not found"})
        }

        const isPasswordValid = await bcrypt.compare(password,userExists.password)
        if(!isPasswordValid){
            return res.status(401).json({message:"Invalid password"})
        }


        const token = genToken(userExists._id)

        res.cookie("token", token, cookieOptions)

        return res.status(200).json({
        success: true,
        message: "Login successful",
        customer: userExists
})


}
    catch(err){
        console.log(err)
        return res.status(500).json({message:"Internal Server Error"})
    }
}

const getMe = (req,res) => {
    const authenticatedCustomer = req.customer
    res.status(200).json({authenticatedCustomer})
}

const logout = async(req,res)=>{

    res.clearCookie("token", cookieOptions)

    return res.status(200).json({
        success: true,
        message: "Logout successful"
    })
}


module.exports = {
    registerCustomer,
    loginCustomer,
    getMe,
    logout
}
