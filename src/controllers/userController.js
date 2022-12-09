const bcrypt = require('bcrypt')
const saltRound = 10
const userModel = require('../models/userModel')
const { uploadFile } = require("../aws/aws");
const jwt = require('jsonwebtoken')
const validation = require("../validation/validation")


const createUser = async function (req, res) {

  try {
    let requestbody = req.body
    let userId = req.query
    let files = req.files;

    if (!validation.isValidInputBody(requestbody))
      return res.
        status(400).
        send({ status: false, message: "Data is required in Request Body" })
    if (validation.isValidInputBody(userId))
      return res.
        status(400).
        send({ status: false, message: "Invalid entry in Request Query" })
    // Destructering

    const { fname, lname, email, password, phone, address, profileImage } = requestbody
    // console.log(requestbody)
    if (!files || files.length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "No profile image found" });
    }

    if (!validation.isValidProfile(files[0].mimetype)) {
      return res.status(400).send({
        status: false,
        message: "Only images can be uploaded (jpeg/jpg/png)",
      });
    }


    //  let k=files.originalname
    //  console.log(files.originalname)
    //  let y=k[k.length-1]
    //  let a=["jpg","jpeg","png"]
    //  if(!a.indexOf(y)){
    //   return res.status(400).send({status:false,message:"provide valid type"})
    //  }
    let fileUrl = await uploadFile(files[0]);
    console.log(files)
    requestbody.profileImage = fileUrl;
    if (!validation.isValid(fname)) {
      return res.status(400).send({ status: false, message: "first name is required" })
    }
    if (!validation.isValidName(fname))
      return res.status(400).send({ status: false, message: "first name should contain only alphabets" })
    if (!validation.isValid(lname)) {
      return res.status(400).send({ status: false, message: "last name is required" })
    }
    if (!validation.isValidName(lname))
      return res.status(400).send({ status: false, message: "last name should contain only alphabets" })
    if (!validation.isValid(phone))
      return res.status(400).send({ status: false, message: "phone number must be prasent" })
    if (!validation.phoneregex(phone))
      return res.status(400).send({ status: false, message: "phone number must be in a valid format" })
    const isPhoneAlreadyUsed = await userModel.findOne({ phone: phone })
    if (isPhoneAlreadyUsed)
      return res.status(400).send({ status: false, message: "phone number already registered" })
    if (!validation.isValid(email))
      return res.status(400).send({ status: false, message: "email is required" })
    if (!validation.emailregex(email))
      return res.status(400).send({ status: false, message: "email should be valid" })
    let emailAlreadyUsed = await userModel.findOne({ email: email })
    if (emailAlreadyUsed)
      return res.status(400).send({ status: false, message: "email already registered" })
    if (!validation.isValid(password))
      return res.status(400).send({ status: false, message: "password is required" })
    if (!validation.passwordregex(password))
      return res.status(400).send({ status: false, message: "password should be valid" })
    let encryptedPassword = bcrypt
      .hash(requestbody.password, saltRound)
      .then((hash) => {
        // console.log(`Hash: ${hash}`);
        return hash;
      });

    requestbody.password = await encryptedPassword;
    //===========================================ADDRESS==============================================
    if (!validation.isValidAddress(address)) {
      return res.status(400).send({ status: false, message: "Address is required!" });
    }
    let arr1 = ["shipping", "billing"];
    let arr2 = ["street", "city", "pincode"];
    for (let i = 0; i < arr1.length; i++) {
      if (!requestbody.address[arr1[i]])
        return res.status(400).send({ status: false, message: `${arr1[i]} is mandatory` });
      for (let j = 0; j < arr2.length; j++) {
        if (!requestbody.address[arr1[i]][arr2[j]])
          return res.status(400).send({ status: false, message: `In  ${arr1[i]}, ${arr2[j]} is mandatory` });
      }

      if (!validation.isValidOnlyCharacters(requestbody.address[arr1[i]].city)) {
        return res.status(400).send({
          status: false,
          message: `In ${arr1[i]} , city is invalid`,
        });
      }

      if (!validation.isValidPincode(requestbody.address[arr1[i]].pincode)) {
        return res.status(400).send({
          status: false,
          message: `In ${arr1[i]} , pincode is invalid`,
        });
      }
    }

    const result = await userModel.create(requestbody)
    // console.log(result)
    return res.status(201).send({ status: true, message: "user Successfully Created", data: result })
  }
  catch (err) {
    res.status(500).send({ message: err.message })
  }

}

// -------------------------------login--------------------------------
const login = async function (req, res) {
  try {
    if (req.body && Object.keys(req.body).length > 0) {
      let { email, password } = req.body
      if (!validation.isValid(email))
        return res.status(400).send({ status: false, message: "email is required" })
      if (!validation.emailregex(email))
        return res.status(400).send({ status: false, message: "email should be valid" })
      if (!validation.isValid(password))
        return res.status(400).send({ status: false, message: "password is required" })
      if (!validation.passwordregex(password))
        return res.status(400).send({ status: false, message: "password should be valid" })
      let user = await userModel.findOne({ email: email })
      // console.log(user)

      if (!user) return res.status(404).send({ status: false, message: " No such user exists" })
      const compare = await bcrypt.compare(password, user.password);
      if (!compare) return res.status(200).send({ status: false, message: "incorrect password" })

      const token = jwt.sign(
        {
          userId: user._id.toString(),
          groupNo: "22"

        }, "secretKeyForgroup22", { expiresIn: "12hr" })
      res.status(200).send({ status: true, message: "User login successfully", data: { userId: user._id, token: token } });

    } else {
      return res.status(400).send({ status: false, message: "body can't be empty" })
    }

  } catch (error) {
    return res.status(500).send({ status: false, err: error.message })
  }
}


// -------------------------getuserprofile-------------------------
const getUserProfile = async function (req, res) {
  try {
    let userId = req.params.userId
    if (!validation.isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "userId is not valid" }) }

    const user = await userModel.findOne({ _id: userId })
    if (!user) {
      return res.status(404).send({ send: false, message: "No profile available with this userId" })
    }
    return res.status(200).send({ status: true, message: "User profile details", data: user })
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message })

  }
}

// ----------------------update----------------------------------


const updateProfile = async function (req, res) {
  try {
    let reqbody = req.body
    let files = req.files
    let user_id = req.params.userId
    let update = {}
    const { fname, lname, email, profileImage, phone, password, address } = reqbody

    if (fname) {
      if (!validation.isValidName(fname))
        return res.
          status(400).
          send({ status: false, message: "fname is invalid" })
      update.fname = fname
    }
    if (lname) {
      if (!validation.isValidName(lname))
        return res.
          status(400).
          send({ status: false, message: "fname is invalid" })
      update.lname = lname
    }
    if (email) {
      if (!validation.emailregex(email))
        return res.
          status(400).
          send({ status: false, message: "email is invalid" })
      let data = await userModel.findOne({ email: email })
      if (data != null)
        return res.
          status(409).
          send({ status: false, message: `this ${data.email} is already present` })
      update.email = email
    }

    if (files.length > 0) {
      if (!validation.isValidProfile(files[0].mimetype))
        return res.
          status(400).
          send({ status: false, msg: "plz provide profileImage in (jpg|png|jpeg) formate" })
      req.Link = await AWS.uploadFile(files[0])
      update.profileImage = req.Link
    }
    if (phone) {
      if (!validation.phoneregex(phone))
        return res.
          status(400).
          send({ status: false, message: "phone no is invalid" })
      let data = await userModel.findOne({ phone: phone })
      if (data != null)
        return res.
          status(409).
          send({ status: false, message: `this ${data.phone} is already present` })
      update.phone = phone
    }
    if (password) {
      if (!validation.passwordregex(password))
        return res.
          status(400).
          send({ status: false, message: "password is not valid" })
          let encryptedPassword = bcrypt
      .hash(reqbody.password, saltRound)
      .then((hash) => {
        // console.log(`Hash: ${hash}`);
        return hash;
      });
      
      update.password = await encryptedPassword
    }
    if (address) {

      if (!validation.isValidAddress(JSON.parse(address)))
        return res.
          status(400).
          send({ status: false, message: "address object must be containt things that u want to be update" })

      let data = await userModel.findById(user_id)
      req.address = data.address

      const { shipping, billing } = JSON.parse(address)

      if (validation.isValidAddress(shipping)) {
        if (shipping.street) {
          if (!validation.isValidOnlyCharacters(shipping.street))
            return res.
              status(400).
              send({ status: false, message: "street is invalid" })
          req.address.shipping.street = shipping.street
        } if (shipping.city) {
          if (!validation.isValidOnlyCharacters(shipping.city))
            return res.
              status(400).
              send({ status: false, message: "city is invalid" })
          req.address.shipping.city = shipping.city

        } if (shipping.pincode) {
          if (!validation.isValidPincode(shipping.pincode))
            return res.
              status(400).
              send({ status: false, message: "pincode is invalid" })
          req.address.shipping.pincode = shipping.pincode
        }
      }

      if (validation.isValidAddress(billing)) {

        if (billing.street) {
          if (!validation.isValidOnlyCharacters(billing.street))
            return res.
              status(400).
              send({ status: false, message: "street is invalid" })
          req.address.billing.street = billing.street
        } if (billing.city) {
          if (!validation.isValidOnlyCharacters(billing.city))
            return res.
              status(400).
              send({ status: false, message: "city is invalid" })
          req.address.billing.city = billing.city
        } if (billing.pincode) {
          if (!validation.isValidPincode(billing.pincode))
            return res.
              status(400).
              send({ status: false, message: "pincode is invalid" })
          req.address.billing.pincode = billing.pincode
        }
      }
      update.address = req.address
    }
    let result = await userModel.findByIdAndUpdate({ _id: user_id }, update, { new: true })
    return res.
      status(200).
      send({ status: true, message: "updated details", data: result })
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message })

  }
}

module.exports = { createUser, login, getUserProfile, updateProfile }
