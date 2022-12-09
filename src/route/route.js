const express = require('express');
const route = express.Router();
const userController=require("../controllers/userController")
const productController = require("../controllers/productController")
const cartController=require("../controllers/cartController")
const orderController=require('../controllers/orderController')
const middleware = require("../middleware/auth")

// ========================User============================================================

// ------------------register-------------------
route.post("/register",userController.createUser)

// ----------------------login------------------
route.post("/login" , userController.login)

// ------------------getUserProfile-------------
route.get("/user/:userId/profile" , middleware.Authenticate ,userController.getUserProfile)


// ---------------updateUserProfile--------------
route.put("/user/:userId/profile",middleware.Authenticate , middleware.Authorization,userController.updateProfile)

// ==========================Product==============================================================

// ----------------------productCreation------------------
route.post("/products",productController.createProduct)

// --------------------------getProducts-------------
route.get("/products" , productController.getProductByFilter)

// -------------------getProductById--------------------
route.get("/products/:productId" ,productController.ProductById )


// ----------------updateProduct-----------------------
route.put("/products/:productId" ,productController.updateProduct)


// --------------------deleteProduct-----------------------
route.delete("/products/:productId" ,productController.deleteProduct)

// =================================cart==========================================================================
// --------------------createCart------------------------------
route.post("/users/:userId/cart",middleware.Authenticate , middleware.Authorization,cartController.createCart)

// --------------------------getcart-------------------------------
route.get("/users/:userId/cart" ,middleware.Authenticate ,middleware.Authorization, cartController.getCart )

// ----------------updateCart--------------------------------------
route.put("/users/:userId/cart" ,middleware.Authenticate , middleware.Authorization,cartController.updateCart)

// --------------------deletecart-------------------------------------
route.delete("/users/:userId/cart" ,middleware.Authenticate , middleware.Authorization,cartController.deleteCart)

// =================================Order====================================================================

// --------------------createorder-----------------------
route.post("/users/:userId/orders",middleware.Authenticate , middleware.Authorization,orderController.createOrder )

// ----------------updateOrder-----------------------
route.put("/users/:userId/orders" ,middleware.Authenticate , middleware.Authorization,orderController.updateOrder)



route.all("/*", function (req, res) {
    res.status(400).send({status: false,message: "The api you request is not available"})
})
module.exports = route;