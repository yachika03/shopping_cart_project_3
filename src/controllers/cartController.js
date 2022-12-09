const userModel=require("../models/userModel")
const cartModel = require("../models/cartModel")
const productModel = require("../models/productModel");

const{isValidObjectId}=require("../validation/validation")

const createCart = async function (req, res) {
    try {
        const userId = req.params.userId
        const { cartId, productId } = req.body
        //-------------------------------------checking user------------------------------------------//
        if (!isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "Please provide a valid userId." }) }
        const checkUser = await userModel.findById(userId)
        if (checkUser == null || checkUser.isDeleted == true) {
            return res.status(404).send({ status: false, message: "user not found or it may be deleted" })
        }
        //-------------------------------------checking product------------------------------------------//
        if (!isValidObjectId(productId)) { return res.status(400).send({ status: false, message: "Please provide a valid productId." }) }
        const checkProduct = await productModel.findById(productId)
        if (checkProduct == null || checkProduct.isDeleted == true) {
            return res.status(404).send({ status: false, message: "Product not found or it may be deleted" })
        }
        //-------------------------------------------------------------------------------------------//
        let itemForAdd = {
            "productId": productId,
            "quantity": 1
        }

        if (cartId) {
            //-------------------------------------checking cart------------------------------------------//
            if (!isValidObjectId(cartId)) { return res.status(400).send({ status: false, message: "Please provide a valid cartId." }) }
            const checkCart = await cartModel.findById(cartId)
            if (checkCart == null || checkCart.isDeleted == true) {
                return res.status(404).send({ status: false, message: "cart not found or it may be deleted" })
            }
            //-------------------------------------------------------------------------------------------//
            let arr = checkCart.items
            for (let i = 0; i < arr.length; i++) {
                if (arr[i].productId == itemForAdd.productId) {
                    arr[i].quantity = arr[i].quantity + itemForAdd.quantity;
                    break
                }
                else if (i == (arr.length - 1)) {
                    arr.push(itemForAdd)
                    break
                }
            }
            // product image
            const dataForUpdate = {
                "userId": userId,
                "items": arr,
                "totalPrice": checkProduct.price + checkCart.totalPrice,
                "totalItems": arr.length///confuse in:when quantity of product is 2 at that time what should be totalItems
            }
            const updateCard = await cartModel.findByIdAndUpdate(
                { "_id": cartId },
                { $set: dataForUpdate }, 
                { new: true }
            ).populate("items.productId",("price title description productImage availableSizes"))
            return res.status(201).send({ status: true, message: "Success", data: updateCard })

        }
        else {
            const checkCart = await cartModel.findOne({ "userId": userId })
            if (checkCart) {
                return res.status(400).send({ status: false, message: "A cart with this userId already present try to edit that cart" })
            }

            const dataForCreate = {
                "userId": userId,
                "items": [itemForAdd],
                "totalPrice": checkProduct.price,
                "totalItems": 1
            }
             await cartModel.create(dataForCreate)
            // .populate("items.productId",("price title description productImage availableSizes"))
            const finalCart = await cartModel.findOne(dataForCreate).populate({ path: 'items.productId', select: { '_id': 1, 'title': 1, 'price': 1, 'productImage': 1, 'description': 1 } })
            return res.status(201).send({ status: true, message: "Success", data: finalCart });
        }
           

        
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}

// -----------------------------------updateCart-------------------------------------------------------------
const updateCart = async function (req, res) {
    try {
        const userId = req.params.userId
        const { productId, cartId, removeProduct } = req.body
        //-------------------------------------checking user------------------------------------------//
        if (!isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "Please provide a valid userId." }) }
         const checkUser=await userModel.findById(userId)
         if (checkUser == null || checkUser.isDeleted == true) {
            return res.status(404).send({ status: false, message: "user not found or it may be deleted" })
         }

        //-------------------------------------checking cart------------------------------------------//

        if (!isValidObjectId(cartId)) { return res.status(400).send({ status: false, message: "Please provide a valid cartId." }) }
        const checkCart = await cartModel.findOne({ "_id": cartId, "userId": userId })
        if (checkCart == null || checkCart.isDeleted == true) {
            return res.status(404).send({ status: false, message: "cart not found either it may be deleted or there is conflict(check userId and cartId are from the same document or not)" })
        }

        //-------------------------------------checking product------------------------------------------//
        if (!isValidObjectId(productId)) { return res.status(400).send({ status: false, message: "Please provide a valid productId." }) }
        const checkProduct = await productModel.findById(productId)
        if (checkProduct == null || checkProduct.isDeleted == true) {
            return res.status(404).send({ status: false, message: "Product not found or it may be deleted" })
        }
        //-----------------------------------------------------------------------------------------------//
       
        let cart = checkCart.items;
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].productId == productId) {
                const priceChange = cart[i].quantity * checkProduct.price

                // directly remove a product from the cart ireespective of its quantity
                // product is to be removed({removeProduct: 0})
                if (removeProduct == 0) {
                    const productRemove = await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } }, totalPrice: checkCart.totalPrice - priceChange, totalItems: checkCart.totalItems - 1 }, { new: true })
                    return res.status(200).send({ status: true, message: 'Success', data: productRemove })
                }

                // remove the product when its quantity is 1
                if (removeProduct == 1) {
                    if (cart[i].quantity == 1 && removeProduct == 1) {
                        const priceUpdate = await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId } }, totalPrice: checkCart.totalPrice - priceChange, totalItems: checkCart.totalItems - 1 }, { new: true })
                        return res.status(200).send({ status: true, message: 'Success', data: priceUpdate })
                    }

                    // decrease the products quantity by 1
                    cart[i].quantity = cart[i].quantity - 1
                    const updatedCart = await cartModel.findByIdAndUpdate({ _id: cartId }, { items: cart, totalPrice: checkCart.totalPrice - checkProduct.price }, { new: true })
                    return res.status(200).send({ status: true, message: 'Success', data: updatedCart })
                }
            }
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}

// ------------------------------------getCart----------------------------------------------------
const getCart = async function (req, res) {///price/title/size/image
    try {
        let userId = req.params.userId
        if (!isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "Please provide a valid userId." }) }
        let user = await userModel.findById(userId)
        if (!user) { return res.status(400).send({ status: false, message: "this user doesnot exists" }) }
        let cart = await cartModel.findOne({ "userId": userId }).populate("items.productId",("price title description productImage availableSizes"))
        if (!cart) { return res.status(400).send({ status: false, message: "this user doesnot have any cart exists" }) }
        return res.status(200).send({ status: true, message: "Success", data: cart })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}

// -------------------------------------------------------deleteCart-----------------------------------------------
const deleteCart = async (req, res) => {
    try {
        let userId = req.params.userId
        if (!isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "Please provide a valid userId." }) };

        const userExist = await userModel.findById(userId)
        if (!userExist) return res.status(404).send({ status: false, msg: "user not found" })

        const cartExist = await userModel.findById(userId)
        if (!cartExist) return res.status(404).send({ status: false, msg: "cart not found" })

        let cart = await cartModel.findByIdAndUpdate((userId), { items: [], totalItems: 0, totalPrice: 0 }, { new: true })
        return res.status(204).send({ status: false, msg: "CART DELETED SUCESSFULLY", data: cart })
    } catch (error) {
        return res.status(500).send({ status: false, err: error.message })
    }
}


module.exports = { createCart, updateCart, getCart, deleteCart }   