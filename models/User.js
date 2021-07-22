const getDb = require("../util/database").getDb;
const mongoID = require("mongodb").ObjectId;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const tokenSecret = require("../privates.js").tokenSecret;

class User {
  constructor(email, password) {
    this.email = email;
    this.password = password;
    this.cart = [];
    this.address = {
      lastUsed: null,
      all: [],
    };
  }

  async saveInDb() {
    try {
      const db = getDb();
      const hashedPassword = await bcrypt.hash(this.password, 13);
      const payload = {
        email: this.email,
        password: hashedPassword,
        cart: this.cart,
      };
      const data = await db.collection("users").insertOne(payload);

      return data.insertedId.toString();
    } catch (err) {
      console.log(err);
    }
  }
  static async saveUserAdress(userId, addressData) {
    try {
      const db = getDb();
      const data = db
        .collection("users")
        .updateOne(
          { _id: mongoID(userId._id) },
          { $set: { address: addressData } }
        );
    } catch (err) {
      console.log(err);
    }
  }
  static async saveCart(cart, token) {
    try {
      const userId = await jwt.verify(token, tokenSecret).userId;
      const mongoId = mongoID(userId);
      const db = getDb();

      const data = await db.collection("users").updateOne(
        { _id: mongoId },
        {
          $set: { cart: cart },
        }
      );

      return data.modifiedCount;
    } catch (err) {
      console.log(err);
    }
  }
  static async getUserCart(userId) {
    try {
      const db = getDb();

      const userData = await db
        .collection("users")
        .findOne({ _id: mongoID(userId) });

      return userData.cart;
    } catch (err) {
      console.log(err);
    }
  }

  static async checkIfExistInDb(email) {
    try {
      const db = getDb();
      const data = await db.collection("users").find({ email }).toArray();

      if (data.length === 0) {
        return false;
      } else {
        return true;
      }
    } catch (err) {
      console.log(err);
    }
  }

  static async loginRequest(email, password) {
    try {
      const db = getDb();
      const data = await db.collection("users").find({ email: email });
      const parsedData = await data.toArray();

      if (parsedData.length === 0) {
        const error = new Error();
        error.status = 404;
        error.message = "User with that email do not exist";
        throw error;
      } else {
        const user = parsedData[0];
        const passwordComparement = await bcrypt.compare(
          password,
          user.password
        );
        if (passwordComparement !== true) {
          const error = new Error();
          error.status = 403;
          error.message = "Incorrect password";
          throw error;
        } else {
          const userAdmin = user.admin;
          const userId = user._id;
          const token = await jwt.sign(
            {
              userId: userId,
              userAdmin,
            },
            tokenSecret,
            { expiresIn: "1h" }
          );
          const payload = {
            userAdmin,
            token,
          };
          return payload;
        }
      }
    } catch (err) {
      throw err;
    }
  }
  static async userLoginWithCookie(userID) {
    try {
      const db = getDb();
      const data = await db.collection("users").find({ _id: mongoID(userID) });
      const parsedData = await data.toArray();

      if (parsedData.length === 0) {
        const error = new Error();
        error.status = 403;
        error.message = "User with that email do not exist";
        throw error;
      }

      const user = parsedData[0];
      const userAdmin = user.admin;
      const userId = user._id;
      const token = await jwt.sign(
        {
          userId: userId,
          userAdmin,
        },
        tokenSecret,
        { expiresIn: "1h" }
      );
      const payload = {
        userAdmin,
        token,
      };
      return payload;
    } catch (err) {
      throw err;
    }
  }
  static async getUserDataFromDb(userId) {
    try {
      const db = getDb();
      const user = db.collection("users").findOne({ _id: mongoID(userId) });
      return user;
    } catch (err) {
      console.log(err);
    }
  }
  static async getUserOrders(userId) {
    try {
      const db = getDb();

      const userOrders = await db
        .collection("orders")
        .find({ userId })
        .sort({ _id: -1 });

      return userOrders;
    } catch (err) {
      console.log(err);
    }
  }
  static async getUserAddresses(userId) {
    try {
      const db = getDb();
      const user = await db
        .collection("users")
        .findOne({ _id: mongoID(userId) }, { address: 1 });
      return user.address;
    } catch (err) {
      console.log(err);
    }
  }
  static async addNewAddress(userId, address) {
    try {
      const db = getDb();
      const user = await db.collection("users").updateOne(
        { _id: mongoID(userId) },
        {
          $push: { "address.all": address },
        }
      );
      return user.modifiedCount;
    } catch (err) {
      console.log(err);
    }
  }
  static async updateDefaultUserAddress(userId, address) {
    try {
      const db = getDb();

      const user = await db.collection("users").updateOne(
        { _id: mongoID(userId) },
        {
          $set: { "address.lastUsed": address },
        }
      );

      return user.modifiedCount;
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = User;
