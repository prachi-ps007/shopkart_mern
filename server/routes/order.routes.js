const express = require("express");

const router = express.Router();
const {isAuthenticated} = require("../middlewares/auth.middleware.js")
const {
    createPaymentOrder,
    verifyPayment,
    getMyOrders,
    getSingleOrder
} = require("../controllers/order.controller.js");


router.post(
    "/create-payment-order",
    isAuthenticated,
    createPaymentOrder
);

router.post("/verify-payment", isAuthenticated, verifyPayment);
router.get("/", isAuthenticated, getMyOrders);
router.get("/:id", isAuthenticated, getSingleOrder);



module.exports = router;