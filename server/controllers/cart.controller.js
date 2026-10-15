const Customer = require("../models/customer.model.js")
const Product = require("../models/product.model.js");

const addToCart = async(req,res) => {
    const {productId} = req.params

    const product = await Product.findById(productId)

    if (!product) {
    return res.status(404).json({
        message: "Product not found"
    })
    }


    const cartItem = req.customer.cart.find((item) => 
        item.product.toString() == productId
    )

    if(!cartItem){


         if(product.stock < 1){
        return res.status(400).json({
            message: "Product is out of stock"
        })
        }


        await Customer.findByIdAndUpdate(
        req.customer._id,
        {
            $push : {
                cart : {
                    product: productId,
                    quantity: 1
                }
            }
        }
    )
    }

    else{

        if(cartItem.quantity + 1 > product.stock){
        return res.status(400).json({
            message: "Requested quantity exceeds stock"
        })
    }

        cartItem.quantity += 1
        await req.customer.save()


//     ANOTHER WAY USING MONGODB OPERATORS
//         await Customer.findOneAndUpdate(
//     {
//         _id: req.customer._id,
//         "cart.product": productId
//     },
//     {
//         $inc: {
//             "cart.$.quantity": 1
//         }
//     }
// )
    }


    const updateCustomer = await Customer.findById(req.customer._id)


    res.status(200).json({
        "success": true,
        "message": "Cart updated",
        "cart": updateCustomer.cart
    })

}



const getCart = async(req,res) => {
    try{
                const customer = await Customer.findById(req.customer._id).populate({
                    path : "cart.product",
                    select : "name price image stock"
                })

                if(customer.cart.length === 0){
                    return res.status(200).json({
                        message: "Cart is empty",
                        cart: []
                    })
                }

                res.status(200).json({
                    success : true,
                    count : customer.cart.length,
                    cart : customer.cart
                })
    }
    catch(error){

        res.status(400).json({
            message : "Error fetching cart",
            error: error.message
        })

    }
}



const updateCartItem = async(req,res) => {
        try{
            const {productId} = req.params
            const {quantity} = req.body

            const product = await Product.findById(productId)


            if(typeof quantity !== "number"){
                return res.status(400).json({
                    message: "Quantity must be a number"
                })
            }

            if(quantity < 1){
                return res.status(400).json({
                    message: "Quantity must be at least 1"
                })
            }
            
            if(!product){
                return res.status(404).json({
                    message: "Product not found"
                })
            }

            if(quantity > product.stock){
                return res.status(400).json({
                    message: "Requested quantity exceeds stock"
                })
            }


            const cartItem = req.customer.cart.find((item) => item.product.toString() === productId)

            if(!cartItem){
                return res.status(404).json({
                    message: "Product not in cart"
                })
            }

            cartItem.quantity = quantity
            await req.customer.save()


            return res.status(200).json({
                success: true,
                message: "Cart quantity updated",
                cart: req.customer.cart
            })
            
        }
        catch(error){
            return res.status(400).json({
                message: "Error updating cart item",
                error: error.message
            })
        }
}


const deleteCartItem = async(req,res) => {
    try{
        const {productId} = req.params 
        const cartItemIndex = req.customer.cart.findIndex((item) => item.product.toString() === productId)

        if(cartItemIndex == -1){
            return res.status(404).json({
                message: "Product not in cart"
            })
        }

        req.customer.cart.splice(cartItemIndex, 1)
        await req.customer.save()

        return res.status(200).json({
            success: true,
            message: "Item removed from cart"
        })
    }
    catch(error){
        return res.status(400).json({
            message: "Error deleting cart item",
            error: error.message
        })
    }
}






module.exports = {addToCart, getCart, updateCartItem, deleteCartItem}