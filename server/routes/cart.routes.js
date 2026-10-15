const express = require("express")
const router = express.Router()
const {addToCart,getCart, updateCartItem, deleteCartItem} = require('../controllers/cart.controller.js');
const {isAuthenticated} = require("../middlewares/auth.middleware.js")


router.post("/:productId", isAuthenticated, addToCart)
router.get("/", isAuthenticated, getCart)
router.patch("/:productId", isAuthenticated, updateCartItem)
router.delete("/:productId", isAuthenticated, deleteCartItem)
module.exports = router