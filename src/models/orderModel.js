const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const orderSchema = new mongoose.Schema({
    userId: { type: ObjectId, ref: "user", required: true },
    // items: [{
    //     productId: {ObjectId, refs to Product model, mandatory},
    //     quantity: {number, mandatory, min 1}
    //   }],
    items: [{
        productId: {
            type: ObjectId,
                ref: 'product',
                required: true
        },
        quantity: {
            type: Number,
            required: true
        },
    }],

    totalPrice: {
        type: Number,
        required: true
    },
    totalQuantity: {
        type: Number,
        required: true
    },
    cancellable: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        default: 'pending',
        enum: ["pending", "completed", "cancelled"]
    },
    deletedAt: {
        type: Date,
        default: undefined
    },
    isDeleted: {
        type: Boolean,
        default: false
    }

}, { timestamps: true })
module.exports = mongoose.model("order", orderSchema);