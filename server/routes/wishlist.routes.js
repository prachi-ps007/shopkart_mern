const express = require("express")
const router = express.Router()
const {addToWishlist, getWishlist, deleteFromWishlist} = require("../controllers/wishlist.controller.js")
const {isAuthenticated} = require("../middlewares/auth.middleware.js")


router.post("/:productId", isAuthenticated, addToWishlist)
router.get("/", isAuthenticated, getWishlist)
router.delete("/:productId", isAuthenticated, deleteFromWishlist)

module.exports = router