const Order = require("../models/order.model")
const razorpay = require("../config/razorpay")
const Product = require("../models/product.model")
const crypto = require("crypto")
const createPaymentOrder = async (req, res) => {

    try{
        const customer = req.customer
    const cart = customer.cart

    if (!cart || cart.length === 0) {
    return res.status(400).json({
        success: false,
        message: "Cart is empty"
    });
}

    const orderItems = []

    let totalAmount = 0

    for(const cartItem of cart){
        const product = await Product.findById(cartItem.product)

        if (!product) {
        return res.status(400).json({
            success: false,
            message: "Product not found"
        });
    }

         if (product.stock < cartItem.quantity) {
            return res.status(400).json({
                success: false,
                message: `Not enough stock for ${product.name}`
            });
        }

        const itemTotal = product.price * cartItem.quantity
        totalAmount += itemTotal


        orderItems.push({
            product : product._id,
            name : product.name,
            price : product.price,
            quantity : cartItem.quantity,
            image : product.image
        })
        }



        const order = await Order.create({
            customer: customer._id,

            items: orderItems,

            shippingAddress: req.body.shippingAddress,

            totalAmount: totalAmount,

            paymentStatus: "PENDING",

            status: "PENDING_PAYMENT"
        })

        console.log("Total amount:", totalAmount);
        console.log("Razorpay amount:", Math.round(totalAmount * 100));

        console.log("Razorpay Key ID:", process.env.RAZORPAY_KEY_ID);
        console.log(
            "Razorpay Secret exists:",
            !!process.env.RAZORPAY_KEY_SECRET
        );


        const razorpayOrder = await razorpay.orders.create({
            amount : Math.round(totalAmount*100),
            currency : "INR",
            receipt : order._id.toString()
        })

        order.razorpayOrderId = razorpayOrder.id
        await order.save()


         return res.status(201).json({
            success: true,

            order: {
                id: order._id,
                amount: totalAmount
            },

            razorpay: {
                keyId: process.env.RAZORPAY_KEY_ID,
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency
            }
        });

    } catch(error){
        console.error("Create payment order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create payment order"
        });
    
    }
    
}


const verifyPayment = async (req ,res) => {
    try{
        const {razorpay_order_id , razorpay_payment_id, razorpay_signature} = req.body
        const order = await Order.findOne({razorpayOrderId : razorpay_order_id , customer: req.customer._id})

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const generatedSignature = crypto
                                    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                                    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                                    .digest("hex")

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed"
            });
        }

        order.paymentStatus = "PAID"
        order.razorpayPaymentId = razorpay_payment_id
        order.status = "PLACED"
        await order.save()

        const customer = req.customer
        customer.cart = []
        await customer.save()

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            orderId: order._id
        });
    }
    catch(error){
        console.error("Payment verification error:", error);

    return res.status(500).json({
        success: false,
        message: "Payment verification failed"
    });
    }
}


const getMyOrders = async (req , res) => {
    try{

        const customer = req.customer
        const orders = await Order.find({
            customer : customer._id
        }).sort({
            createdAt : -1
        })

        return res.status(200).json({
            success: true,
            orders: orders
        });
    }
    catch(error){
        console.error("Get orders error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch orders"
        });
    }
}

const getSingleOrder = async (req,res) => {
    try{
        const order = await Order.findOne({
            _id : req.params.id,
            customer : req.customer._id
        })


        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        return res.status(200).json({
            success: true,
            order: order
        });
    }
    catch(error){
        console.error("Get single order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch order"
        });
    }
}


module.exports = {
    createPaymentOrder,
    verifyPayment,
    getMyOrders,
    getSingleOrder
};