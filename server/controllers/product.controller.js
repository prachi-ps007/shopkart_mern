const Product = require("../models/product.model.js");


const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, image, stock } = req.body;

    if(!name || !description || !category || !image){
        res.status(400).json({message: "All fields are required"})
    } 

    if(typeof price !== 'number' || price<=0 ){
        return res.status(400).json({message: "Price must be a positive number"})
    }

    if(typeof stock !== 'number' || stock<0){
        return res.status(400).json({message: "Stock must be a non-negative number"})
    }

    const product = await Product.create({
        name,
        description,
        price,
        category,
        image,
        stock
    })

    return res.status(201).json({success: true, message: "Product created successfully", product})
    }
    catch (error) {
        res.status(500).json({message: "Error creating product", error: error.message})
    }


}


const getAllProducts = async(req,res) => {

    try{
    const {search , category} = req.query

    let query = {}
    if(search){
        query.name = {
            $regex : search,
            $options : "i"
        }
    }

    if(category){
        query.category = category
    }

    const products = await Product.find(query)

    res.status(200).json({success: true, message:"All the required products are found", products})
    }

    catch(error){
    return res.status(500).json({
        message: "Error fetching products",
        error: error.message
    })
    }
    

    
}


const getProductById = async(req,res) => {
    const {id} = req.params

    // if(typeof id !== Number){
    //     return res.status(400).json({message: "Invalid id"})
    // }
    const product = await Product.findById(id)
    if(!product){
        return res.status(404).json({message: "Product Not Found"})
    }
    return res.status(200).json({success: true, product})
}


module.exports = {
    createProduct,
    getAllProducts,
    getProductById
}