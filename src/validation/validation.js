const mongoose = require("mongoose")


const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value == 'string' && value.trim().length === 0) return false
    return true
  }
  const isValidAddress = function (data) {
    if (typeof (data) === "undefined" || data === null) return false;
    if (typeof (data) === "object" && Array.isArray(data) === false && Object.keys(data).length > 0) return true;
    return false;
  };
  
  
  const isValidPincode = function (data) {
    if ((/^[1-9][0-9]{5}$/.test(data))) {
      return true
    }
    return false
  }
  const isValidOnlyCharacters = function (data) {
    if (data === undefined) return false
    return /^[A-Za-z ]+$/.test(data)
  
  }
  const phoneregex = function (data) {
    if ((/^([6-9]\d{9})$/.test(data))) {
      return true
    }
    return false
  }
  const emailregex = function (data) {
    if ((/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(data))) {
      return true
    }
    return false
  }
  const passwordregex = function (data) {
    if ((/^[a-zA-Z0-9!@#$%^&*]{8,15}$/.test(data))) {
      return true
    }
    return false
  }
  
  // const phoneregex = /^([6-9]\d{9})$/
  // const emailregex = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/
  // const passwordregex = /^[a-zA-Z0-9!@#$%^&*]{8,15}$/
  const isValidStreet=function(value){
    return /^[\S]?\w+[$,#,@,!]*$/.test(value)
}
const isValidSizes = (size) => {
  const validSize = size.split(",").map(x => x.trim())
  let givenSizes = ["S", "XS", "M", "X", "L", "XXL", "XL"]
  for (let i = 0; i < validSize.length; i++) {
      if (!givenSizes.includes(validSize[i])) {
          return false
      }
  }
  return true
}
  function isValidPrice(value) {
    return /^[1-9]{1}\d*((\.)\d+)?$/.test(value)
  }
  const isValidName = function (value) {
    return /^[A-Za-z]+((\s)?[A-Za-z]+)*$/.test(value)
  }

  const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId);
};
const isValidInputBody = function(object) {
  return Object.keys(object).length > 0
}
const isValidProfile=function(value){
  const reg = /image\/png|image\/jpeg|image\/jpg/;
  return reg.test(value)
}
const alphaNumericValid = (value) => {
  let alphaRegex =/^[a-zA-Z0-9-_ ]+$/;   
  if (alphaRegex.test(value))
      return true;  // /^[- a-zA-Z'\.,][^/]{1,150}/ allows every things
}
const isValidRequest = (value) => {
  if (Object.keys(value).length === 0) return false;
  return true;
}

module.exports={isValid,isValidAddress,isValidInputBody,isValidName,isValidOnlyCharacters,isValidStreet,isValidRequest,
  isValidObjectId,isValidPrice,passwordregex,emailregex,phoneregex,isValidPincode,isValidProfile,isValidSizes,alphaNumericValid}
