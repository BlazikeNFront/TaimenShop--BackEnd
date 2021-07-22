//userId is not modified string of _id(mongoDb)
//cart is an array with product objects
const getDb = require("../util/database.js").getDb;
const mongoID = require("mongodb").ObjectId;

class Order {
  constructor(userId, cart, userAddress) {
    this.userId = userId;
    this.cart = cart;
    this.userAddress = userAddress;
    this.status = 0; //status is always 0 an initialzation (0 === means it wait for admin acceptance)
  }
  getOrders() {}
  static async getOrders() {
    try {
      const db = getDb();
      const orders = await db.collection("orders").find().sort({ _id: -1 });
      return orders;
    } catch (err) {
      console.log(err);
    }
  }

  async saveOrder() {
    try {
      const db = getDb();

      this.cart.forEach(async (element) => {
        const product = await db
          .collection("products")
          .findOne({ _id: mongoID(element._id) });

        const resultOfUpdatingQuantity = await db
          .collection("products")
          .updateOne(
            { _id: mongoID(element._id) },
            { $set: { quantity: product.quantity - element.quantity } }
          );

        if (resultOfUpdatingQuantity.modifiedCount !== 1) {
          throw new Error(
            "Database Error in modification of product in saveOrder function"
          );
        }
      });

      const insertedId = await db.collection("orders").insertOne(this);
      return insertedId;
    } catch (err) {
      console.log(err);
    }
  }
  static async updateOrderStatus(orderId, status) {
    try {
      const db = getDb();
      const rawData = await db.collection("orders").updateOne(
        {
          _id: mongoID(orderId),
        },
        {
          $set: { status: status },
        }
      );

      return rawData.modifiedCount;
    } catch (err) {
      console.log(err);
    }
  }
  deleteOrder(orderId) {}
}
module.exports = Order;
