const orderModel = require('../models/orderModel')
const userModel = require("../models/userModel")
const cartModel = require("../models/cartModel")


const{isValidObjectId}=require("../validation/validation")


const createOrder = async function (req, res) {
    try {
        userId = req.params.userId
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, msg: `${userId} is not valid` })
        const userInUserId = await userModel.findOne({ _id: userId, isDeleted: false })
        if (!userInUserId)
            return res.status(404).send({ status: false, msg: `${userId} is not found or deleted` })
        const data = req.body
        let cartId = data.cartId
        if (!isValidObjectId(cartId))
            return res.status(400).send({ status: false, msg: `${cartId} is not valid` })
        let cartData = await cartModel.findOne({ _id: cartId, userId: userId }).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 })
        if (!cartData) {
            return res.status(400).send({ status: false, message: "NO cart exist for this user" })
        }
        if (cartData.items.length === 0)
            return res.status(400).send({ status: false, msg: "Your cart is empty" })

        let cartDetails = JSON.parse(JSON.stringify(cartData))
        console.log(JSON.stringify(cartData))
        console.log(cartDetails)
        let itemsArr = cartDetails.items
        let totalQuantity = 0
        for (let i = 0; i < itemsArr.length; i++) {
            totalQuantity += itemsArr[i].quantity
        }
        cartDetails.totalQuantity = totalQuantity

        if (data.status) {
            if (data.status !== "pending" && data.status !== "completed" && data.status !== "cancelled") {
                return res.status(400).send({ status: false, message: "status should be-'pending','completed','cancelled'" })
            }
            cartDetails.status = data.status
        }
        if (data.cancellable === false) {
            cartDetails.cancellable = data.cancellable
        }
        let orderDetails = await orderModel.create(cartDetails)
        console.log(cartDetails)
        await cartModel.findOneAndUpdate({ userId: userId }, { items: [], totalPrice: 0, totalItems: 0 })
        return res.status(201).send({ status: true, message: "Success", data: orderDetails })
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

// --------------------------------------updateOrder------------------------------------------------------------
const updateOrder = async function (req, res) {
    try {
        userId = req.params.userId
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, msg: `${userId} is not valid` })
        const userInUserId = await userModel.findOne({ _id: userId, isDeleted: false })
        if (!userInUserId)
            return res.status(404).send({ status: false, msg: `${userId} is not found or deleted` })
        const data = req.body
        let { orderId, status } = data
        if (!isValidObjectId(orderId))
            return res.status(400).send({ status: false, msg: `${orderId} is not valid` })
        let orderData = await orderModel.findOne({ _id: orderId, userId: userId }).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 })
        if (!orderData) {
            return res.status(404).send({ status: false, message: `no order found by ${orderId} ` })
        }
        if (!["pending", "completed", "cancelled"].includes(status))
            return res.status(400).send({ status: false, message: "status should be from [pending, completed, cancelled]" });
        if (orderData.status === "completed") {
            return res.status(400).send({ status: false, message: "Order completed, now its status can not be updated" });
        }
        if (status === "cancelled" && orderData.cancellable === false) {
            return res.status(400).send({ status: false, message: "This order can not be cancelled" })
        }
        if (status === "pending") {
            return res.status(400).send({ status: false, message: "order status is already pending" });
        }

        const updateStatus = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status } }, { new: true });

        res.status(200).send({ status: true, message: "Success", data: updateStatus });
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

module.exports = { createOrder, updateOrder }