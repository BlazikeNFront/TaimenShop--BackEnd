const Product = require("../models/Product.js");
const Order = require("../models/Order.js");
const getDb = require("../util/database.js").getDb;
const mongoID = require("mongodb").ObjectId;
const jwt = require("jsonwebtoken");
const tokenSecret = require("../privates.js").tokenSecret;
const checkForToken = require("../util/auth.js").checkForToken;
const createResizedImage = require("../util/jimp.js").createResizedImages;

const ORDERS_PER_PAGE = 10;
exports.addProduct = async (req, res) => {
  try {
    const token = checkForToken(req);
    if (token === null) {
      throw new Error("Unauthorized user");
    }
    const tokenVerification = await jwt.verify(token, tokenSecret);
    if (!tokenVerification) {
      throw new Error("Unauthorized user");
    }
    const type = req.body.type;
    const category = req.body.category;
    const name = req.body.name;
    const description = req.body.description;
    const price = req.body.price;
    const quantity = req.body.quantity;
    const image = req.file;

    if (!image) {
      const error = new Error("Incorrect type of file was provided");

      res.status(422).send(error);
      return;
    }

    const relativePath = image.path.replace(/\\/g, "/");
    console.log(relativePath);
    const imagesPaths = await createResizedImage(relativePath);

    const tags = name.split(" ");
    tags.push(category);
    tags.push(type);
    tags.push(type + "s"); // add tag for plurarity => 'rod' => 'rods'
    const tagsFormatted = tags.map((tag) => {
      return tag.toLowerCase();
    });

    const product = new Product(
      type,
      category,
      name,
      description,
      tagsFormatted,
      price,
      quantity,
      imagesPaths
    );
    const insertedId = await product.saveInDb();
    if (!insertedId) {
      throw new Error("Couldn't save product in database or image on AWS");
    }
    res.status(200).send();
  } catch (err) {
    console.log(err);
    const error = new Error("Couldn't add product, try again later");
    res.status(422).send(error);
  }
};
exports.getOrders = async (req, res) => {
  try {
    const token = checkForToken(req);
    if (token === null) {
      throw new Error("Unauthorized user");
    }

    const tokenVerification = jwt.verify(token, tokenSecret);
    if (!tokenVerification) {
      throw new Error("Unauthorized user");
    }
    if (tokenVerification.userAdmin !== true) {
      throw new Error("Unauthorized user");
    }

    const page = req.query.page;
    const data = await Order.getOrders();
    const totalDocuments = await data.count();
    const dataToSend = await data
      .skip((page - 1) * ORDERS_PER_PAGE)
      .limit(ORDERS_PER_PAGE)
      .toArray();
    const payload = {
      data: dataToSend,
      totalItems: totalDocuments,
    };
    res.status(200).send(await JSON.stringify(payload));
  } catch (err) {
    console.log(err);
    const error = new Error("Couldn't get orders, try again later");
    res.status(500).send(error);
  }
};
exports.changeOrderStatus = async (req, res) => {
  try {
    const token = checkForToken(req);
    if (token === null) {
      throw new Error("Unauthorized user");
    }

    const tokenVerification = jwt.verify(token, tokenSecret);
    if (!tokenVerification) {
      throw new Error("Authentication rejected");
    }

    const { orderId, orderStatus } = req.body;
    if (!tokenVerification.userAdmin) {
      throw new Error("Authorization failed");
    }

    const modifiedCount = await Order.updateOrderStatus(orderId, orderStatus);

    if (modifiedCount !== 1) {
      throw new Error("Database error in changeOrderStatusController");
    }
    res.status(200).send();
  } catch (err) {
    console.log(err);
    const error = new Error("Couldn't change status, try again later");
    res.status(500).send(error);
  }
};
