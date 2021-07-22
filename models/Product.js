const getDb = require("../util/database.js").getDb;
const mongoID = require("mongodb").ObjectId;

class Product {
  constructor(
    type,
    category,
    name,
    description,
    tags,
    price,
    quantity,
    imagePath
  ) {
    this.type = type;
    this.category = category;
    this.name = name;
    this.description = description;
    this.tags = tags;
    this.price = price;
    this.quantity = quantity;
    this.imagePath = imagePath;
  }
  static async getProduct(prodId) {
    try {
      const db = getDb();
      const product = await db
        .collection("products")
        .findOne({ _id: mongoID(prodId) });

      return product;
    } catch (err) {
      console.log(err);
    }
  }
  static async userQuerySearch(query) {
    try {
      const splittedWords = query.split(" ").map((elem) => elem.toLowerCase());

      const db = await getDb();
      const rawData = await db
        .collection("products")
        .find({ tags: { $all: splittedWords } })
        .sort({ _id: -1 });

      return rawData;
    } catch (err) {
      console.log(err);
    }
  }
  async saveInDb() {
    try {
      const db = await getDb();
      const productSaveResult = await db.collection("products").insertOne(this);
      return productSaveResult.insertedId;
    } catch (err) {
      console.log(err);
    }
  }

  static async checkIfProductIsAvaliable(prodId, quantity) {
    try {
      const db = await getDb();
      const product = await db
        .collection("products")
        .findOne({ _id: mongoID(prodId) });

      if (product.quantity - quantity < 0) {
        return false;
      } else {
        return true;
      }
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  static async getOrderValue(cart) {
    try {
      let orderValue = 0;

      await Promise.all(
        cart.map(async (product) => {
          const productOb = await this.getProduct(product._id);

          orderValue = (
            Number(orderValue) +
            Number(productOb.price) * Number(product.quantity)
          ).toFixed(2);
        })
      );
      return orderValue;
    } catch (err) {
      console.log(err);
    }
  }
  static async checkIfProductsAreAvaliable(products) {
    try {
      const productsUnavaliable = [];
      await Promise.all(
        products.map(async (product) => {
          const isAvaliable = await Product.checkIfProductIsAvaliable(
            product._id,
            product.quantity
          );
          if (isAvaliable === false) {
            productsUnavaliable.push(product);
          }
        })
      );

      return productsUnavaliable;
    } catch (err) {
      console.log(err);
      return false;
    }
  }
}

module.exports = Product;
