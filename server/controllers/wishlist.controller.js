const Customer = require("../models/customer.model.js")
const Product = require("../models/product.model.js");


const addToWishlist = async(req,res) => {

    try{
        const {productId} = req.params

        // if(typeof productId != "string"){
        //     return res.status(400).json({message: "Invalid product ID"})
        // }

        const product = await Product.findById(productId)

        if(!product){
            return res.status(404).json({
                message: "Product not found"
            });
        }


        // One Way To Do this 
        // const alreadyExists = req.customer.wishlist.some(
        //     (id) => id.toString() == productId
        // )
        // if(alreadyExists){
        //     return res.status(409).json({
        //         message: "Product already in wishlist"
        //     });
        // }


        // req.customer.wishlist.push(productId)
        
        // await req.customer.save();


        // Another way using mongodb operators
        await Customer.findByIdAndUpdate(
            req.customer._id,
            {
                $addToSet : {
                    wishlist : productId
                } 
            }
        )
    
        res.status(200).json({
            success: true,
            message : "Product added to Wishlist"
        })
    }
    catch(err){
        res.status(400).json({message: err.message})
    }
}


const getWishlist = async(req,res) => {

    try{
    
        const customer = await Customer.findById(req.customer._id).populate({
            path : "wishlist",
            select : "name price category image stock"
        })

        if (customer.wishlist.length === 0) {
            return res.status(200).json({
                message: "Wishlist is empty",
                wishlist: []
            });
        }

        res.status(200).json({
            success : true,
            count : customer.wishlist.length,
            wishlist : customer.wishlist
        })
    }
    catch(error){
         res.status(400).json({
            message : "Error fetching wishlist",
            error: error.message
        })
    }
    

}

const deleteFromWishlist = async(req,res) => {
    try{

        const {productId} = req.params

        const product = await Product.findById(productId)

         if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        const index = req.customer.wishlist.indexOf(productId)

         if (index === -1) {
            return res.status(404).json({
                message: "Product not in wishlist"
            });
        }


        // 1st Approach 
        // req.customer.wishlist.splice(index,1)

        // await req.customer.save()


        //2nd Approach using mongodb Operators
        const customer = await Customer.findOneAndUpdate(
            {
                _id: req.customer._id   //WHAT TO FIND
            }, 
            {
                $pull : {
                    wishlist : productId   //WHAT TO CHANGE
                }
            },
            { returnDocument: "after" }
        )
    
        res.status(200).json({
            "success": true,
            "message": "Product removed from wishlist"
        })
    }
    catch(error){
        res.status(400).json({
            message: "Error in Deleting the product",
            error : error.message
        })
    }
}

module.exports={
    addToWishlist,
    getWishlist,
    deleteFromWishlist
}