const productModel = require('../models/productModel.js')
const { uploadFile } = require("../aws/aws")
const validation = require("../validation/validation")



const createProduct = async function (req, res) {
  try {
    let files = req.files
    let requestbody = req.body
    if (!validation.isValidInputBody(requestbody))
      return res.status(400).send({ status: false, message: "body should not be empty" })

    let { title, description, price, currencyId, currencyFormat, availableSizes, productImage } = requestbody
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
    let fileUrl = await uploadFile(files[0]);
    // console.log(files)
    requestbody.productImage = fileUrl;


    if (!validation.isValid(title))
      return res.status(400).send({ status: false, message: "title is required" })
    let titleAlreadyexist = await productModel.findOne({ title: title })
    if (titleAlreadyexist)

      return res.status(400).send({ status: false, message: "title already exist" })
    // console.log(title)
    if (!validation.isValid(description))
      return res.status(400).send({ status: false, message: "description is required" })
    if (!validation.isValid(price))
      return res.status(400).send({ status: false, message: "price is required" })
    if (!validation.isValidPrice(price))
      return res.status(400).send({ status: false, message: "price should be valid and given in only numbers" })
    if (!validation.isValid(currencyId))
      return res.status(400).send({ status: false, message: "currencyIdis required" })
    if (currencyId != "INR")
      return res.status(400).send({ status: false, message: "currencyId should be only INR" })
    if (!validation.isValid(currencyFormat))
      return res.status(400).send({ status: false, message: "currencyFormat is required" })
    if (currencyFormat != "₹")
      return res.status(400).send({ status: false, message: "currencyFormat should be only ₹" })
    if (style) {
      if (!validation.isValid(style))
        return res.status(400).send({ status: false, message: " style should be valid " })
    }
    let enumSize = ["S", "XS", "M", "X", "L", "XXL", "XL"];
    for (let i = 0; i < availableSizes.length; i++) {
      if (!enumSize.includes(availableSizes[i])) {
        return res.status(400).send({
          status: false,
          message: "availableSizes should be-[S, XS,M,X, L,XXL, XL]",
        });
      }
    }
    const create = await productModel.create(requestbody)
    return res.status(201).send({ status: true, message: "Success", data: create })
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message })
  }
}
// ----------------getProductByFilter----------------------

const getProductByFilter = async function (req, res) {

  try {
    let data = req.query;
    let filter = { isDeleted: false };

    // validation for the empty body
    if (validation.isValidRequest(data)) {

      let { size, name, priceGreaterThan, priceLessThan, priceSort } = data;

      // validation for size
      if (size) {
        size = size.toUpperCase()
        if (!(validation.isValidSizes(size))) {
          let givenSizes = ['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL']
          return res.status(400).send({ status: false, message: `size should be one these only ${givenSizes}` })

        } else {
          size = size.split(',')
          filter.availableSizes = { $in: size }

        }
      }
      // validation for name
      if (name) {
        if (!validation.isValid(name))
          return res.status(400).send({ status: false, message: "Product title is required" });
        if (!validation.alphaNumericValid(name))
          return res.status(400).send({ status: false, message: "Product title should be valid" });

        filter.title = { $regex: name }; // check the substring
      };

      // validation for price
      if (priceGreaterThan || priceLessThan) {
        filter.price = {}

        if (priceGreaterThan) {
          if (isNaN(priceGreaterThan))
            return res.status(400).send({ status: false, message: "priceGreaterThan is required and should be valid" });

          priceGreaterThan = Number(priceGreaterThan)
          filter.price.$gte = priceGreaterThan;
        }
        if (priceLessThan) {
          if (isNaN(priceLessThan))
            return res.status(400).send({ status: false, message: "priceLessThan  is required and should be valid" });

          priceLessThan = Number(priceLessThan)
          filter.price.$lte = priceLessThan;
        }
      }

      if ((priceGreaterThan && priceLessThan) && (priceGreaterThan > priceLessThan))
        return res.status(400).send({ status: false, message: "Invalid price range" });

      // validation for price sorting
      if (priceSort) {
        if (!((priceSort == 1) || (priceSort == -1))) {
          return res.status(400).send({ status: false, message: 'In price sort it contains only 1 & -1' });
        }

        const products = await productModel.find(filter).sort({ price: priceSort });

        if (!products) return res.status(404).send({ status: false, message: 'No products found' })
        return res.status(200).send({ status: true, message: 'Success', data: products });
      }
    }

    // find collection without filters
    const findData = await productModel.find(filter).sort({ price: 1 });
    if (findData.length == 0)
      return res.status(404).send({ status: false, message: 'No products found' });

    return res.status(200).send({ status: true, message: "Success", data: findData });

  } catch (error) {
    res.
      status(500).
      send({ status: false, message: error.message })
  }
}
// -----------------getProductById-----------------------------
const ProductById = async function (req, res) {
  try {
    let requestbody = req.body
    if (validation.isValidInputBody(requestbody))

      return res.status(400).send({ status: false, message: "invalid request" });
    let reqquery = req.query;
    if (validation.isValidInputBody(reqquery)) return res.status(400).send({ status: false, message: "invalid request" });
    let productId = req.params.productId
    if (!validation.isValidObjectId(productId)) { return res.status(400).send({ status: false, message: "productId is not valid" }) }

    const product = await productModel.findOne({ _id: productId, isDeleted: false })
    if (!product) {
      return res.status(404).send({ send: false, message: "No profile available with this productId or might be deleted" })
    }
    return res.status(200).send({ status: true, message: "Success", data: product })


  } catch (error) {
    return res.status(500).send({ status: false, message: error.message })
  }

}

// ----------------------------updateProduct--------------------

const updateProduct = async function (req, res) {

  try {
    let files = req.files
    let productId = req.params.productId;

    if (!validation.isValidObjectId(productId))
      return res.status(400).send({ status: false, message: `please provide valid ${productId}` })

    const productByproductId = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!productByproductId) {
      return res
        .status(404)
        .send({ status: false, message: " Product not found" });
    }
    let data = req.body;
    let {
      title,
      price,
      currencyId,
      currencyFormat,

      availableSizes,
      productImage,
    } = data;


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
    let fileUrl = await uploadFile(files[0]);
    console.log(files)
    data.productImage = fileUrl;

    if (title) {
      let uniqueTitle = await productModel
        .findOne({ title: title })

      if (uniqueTitle) {
        return res.status(400).send({
          status: false,
          message: "Title already present",
        });
      }
    }

    if (price) {
      if (!validation.isValidPrice(price)) {
        return res.status(400).send({
          status: false,
          message:
            "Price should be in digits ",
        });
      }
    }
    if (currencyId) {
      if (currencyId != "INR") {
        return res.status(400).send({ status: false, message: "currencyId should be INR", });
      }
    }

    if (currencyFormat) {
      if (currencyFormat != "₹") {
        return res.status(400).send({status: false,message: "CurrencyFormat should be ₹ ", });
      }
    }

    if (availableSizes) {
      let enumSize = ["S", "XS", "M", "X", "L", "XXL", "XL"];
      for (let i = 0; i < availableSizes.length; i++) {
        if (!enumSize.includes(availableSizes[i])) {
          return res.status(400).send({
            status: false,
            message: "availableSizes should be-[S, XS,M,X, L,XXL, XL]" });
        }
      }
    }

    let updatedData = await productModel.findOneAndUpdate(
      { _id: productId },
      data,
      {
        new: true,
      }
    );
    return res.status(200).send({
      status: true,
      message: "Update product details is successful",
      data: updatedData,
    });
  } catch (err) {
    return res.status(500).send({ status: false, error: err.message });
  }


}
// ----------------------------deleteProduct -------------------------
const deleteProduct = async function (req, res) {
  try {
    let requestbody = req.body
    if (validation.isValidInputBody(requestbody))

      return res.status(400).send({ status: false, message: "invalid request" });
    let reqquery = req.query;
    if (validation.isValidInputBody(reqquery)) return res.status(400).send({ status: false, message: "invalid request" })
    let productId = req.params.productId;
    if (!validation.isValidObjectId(productId)) { return res.status(400).send({ status: false, message: `${productId} is not valid` }) }
    let productIdInDb = await productModel.findOne({ _id: productId, isDeleted: false })
    if (!productIdInDb) return res.status(400).send({ status: false, message: "product is deleted or not found" })
    await productModel.findByIdAndUpdate({ _id: productId }, { $set: { isDeleted: true, deletedAt: Date.now() } }, { new: true })
    return res.status(200).send({ status: true, message: "product is deleted successfully" })
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message })
  }
}
module.exports = { createProduct, getProductByFilter, ProductById, updateProduct, deleteProduct }



