const Product = require("../models/Product.js");
const PRODUCT_PER_PAGE = 8;

exports.userSearch = async (req, res) => {
  try {
    const query = req.params.query;
    const page = req.query.page;

    const data = await Product.userQuerySearch(query);
    const totalDocuments = await data.count();

    const dataToSend = await data
      .skip((page - 1) * PRODUCT_PER_PAGE)
      .limit(PRODUCT_PER_PAGE)
      .toArray();

    const payload = {
      data: dataToSend,
      totalItems: totalDocuments,
    };

    res.status(200).send(await JSON.stringify(payload));
  } catch (err) {
    console.log(err);
    const error = new Error("Error occured, try again later");
    res.status(500).send(error);
  }
};

exports.getProductDetail = async (req, res) => {
  try {
    const prodId = req.params.prodId;
    const product = await Product.getProduct(prodId);

    res.send(product);
  } catch (err) {
    console.log(err);
    const error = new Error("Error occured, try again later");
    res.status(500).send(error);
  }
};
