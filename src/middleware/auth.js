const jwt = require("jsonwebtoken")
const mongoose = require("mongoose");
const userModel = require("../models/userModel")

// ---------------------------Authentication------------------------------------------------
const Authenticate = async function (req, res, next) {
    try {
        let token = req.headers["authorization"];
        // console.log(token)

        if (!token) return res.status(400).send({ status: false, message: "Token must be present in the request header" })
        token = token.replace("Bearer " , "")
        // console.log(token)
        jwt.verify(token , "secretKeyForgroup22", (error, decodedToken) => {
            if (error) {
                return res.status(401).send({ status: false, error:error.message })
            }
            else {
                req.decodedToken = decodedToken
                next()
            }
        })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}
// -----------------------------------Authorization----------------------------------
const isValidObjectId = (ObjectId) => {
    return mongoose.Types.ObjectId.isValid(ObjectId)
  }

const Authorization = async function (req, res, next) {
    try {
        //****USERID VALIDATION***** */
       const userId=req.params.userId
       if(!userId) return res.status(400).send({status:false,message:"userId is must"})
       if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "userId is invalid" });
       const decodedToken = req.decodedToken
       const userbyuserId= await userModel.findOne({"_id": userId, isDeleted: false})
       if(!userbyuserId){
        return res.status(400).send({status:false,message:`Enter valid userId ${userId}, userId does not found`})
       }
       //*****AUTHORIZATION*****
        if (decodedToken.userId !=userbyuserId._id) return res.status(403).send({ status: false, message: "unauthorize access" });
        next()
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = {Authenticate , Authorization }