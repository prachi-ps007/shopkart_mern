const express = require("express")

const router = express.Router()

const {registerCustomer, loginCustomer, getMe, logout} = require("../controllers/customer.controller.js")
const {isAuthenticated} = require("../middlewares/auth.middleware.js")

router.post("/register", registerCustomer)
router.post("/login", loginCustomer)
router.get("/me", isAuthenticated, getMe)
router.post("/logout", logout)

module.exports = router