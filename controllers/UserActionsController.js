const User = require("../models/User");
const Order = require("../models/Order.js");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const tokenSecret = require("../privates.js").tokenSecret;
const checkForToken = require("../util/auth.js").checkForToken;
const ORDERS_PER_PAGE = 10;
const Product = require("../models/Product.js");

exports.signUp = async (req, res, next) => {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      const payload = await JSON.stringify(validationErrors);
      return res.status(400).send(payload);
    }
    const email = req.body.email;
    const password = req.body.password;
    const checkIfExist = await User.checkIfExistInDb(email);

    //check if user already exist in DB
    if (checkIfExist === false) {
      const user = new User(email, password);
      const userId = await user.saveInDb();

      //check if insertion was added in DB
      if (!userId) {
        const error = new Error("Problem on database side");
        error.status(500);
        throw error;
      }
      //account created - send response to front
      res.status(200).send({
        message: "Account successfully created",
      });
    } else {
      const error = new Error("Email exist in database");
      res.status(409).send(error);
      throw error;
    }
  } catch (err) {
    console.log(err);
    const error = new Error("Error occured, try again later");
    res.status(500).send(error);
  }
};

exports.userAuth = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const authData = await User.loginRequest(email, password);

    res.cookie("token", authData.token, {
      maxAge: 1800000,
      httpOnly: true,
      secure: true,
    });
    res.status(200).send(authData);
  } catch (err) {
    if (err.status === 404) {
      const error = new Error("User does not exist");
      res.status(404).send(error);
      return;
    } else if (err.status === 403) {
      const error = new Error("Incorrect password");
      res.status(403).send(error);
      return;
    }
    const error = new Error("Error occured, try again later");
    res.status(500).send(error);
  }
};
exports.userCookieAuth = async (req, res, next) => {
  try {
    const token = checkForToken(req);
    if (token === null) {
      throw new Error("Unauthorized user");
    }

    const tokenVerification = jwt.verify(token, tokenSecret);
    if (!tokenVerification) {
      throw new Error("Authentication rejected");
    }

    const authData = await User.userLoginWithCookie(tokenVerification.userId);

    res.setHeader(
      "Set-Cookie",
      `token=${authData.token};Max-Age=1800000;HttpOnly;Secure`
    );
    res.setHeader("Access-Control-Allow-Credentials", "true"); //30min

    res.status(200).send(authData);
  } catch (err) {
    console.log(err);
    const error = new Error("Error occured, try again later");
    res.status(500).send(error);
  }
};

exports.updateUserCart = async (req, res) => {
  try {
    const cart = req.body.cart;
    const token = checkForToken(req);
    if (token === null) {
      throw new Error("Unauthorized user");
    }

    const tokenVerification = jwt.verify(token, tokenSecret);
    if (!tokenVerification) {
      throw new Error("Authentication rejected");
    }
    const modifiedCount = await User.saveCart(cart, token);
    if (modifiedCount !== 1) {
      throw new Error("Db did not updated cart correctly");
    }
    const responseJSON = await JSON.stringify({ message: "Updated Cart" });
    res.status(200).send(responseJSON);
  } catch (err) {
    console.log(err);
    const error = new Error("Error occured, try again later");
    res.status(500).send(error);
  }
};
exports.getUserCart = async (req, res) => {
  try {
    const token = checkForToken(req);
    if (token === null) {
      throw new Error("Unauthorized user");
    }

    const tokenVerification = jwt.verify(token, tokenSecret);
    if (!tokenVerification) {
      throw new Error("Authentication rejected");
    }
    const cart = await User.getUserCart(tokenVerification.userId);

    res.status(200).send(await JSON.stringify({ cart }));
  } catch (err) {
    console.log(err);
    const error = new Error("Error occured, try again later");
    res.status(500).send(error);
  }
};

exports.confirmOrder = async (req, res) => {
  try {
    const cart = req.body.cart;
    const userAddress = req.body.userAddress;

    const token = checkForToken(req);
    if (token === null) {
      throw new Error("Unauthorized user");
    }

    const tokenVerification = await jwt.verify(token, tokenSecret);
    if (!tokenVerification) {
      throw new Error("Authentication error");
    }
    const userId = tokenVerification.userId;
    const userCartValue = cart
      .reduce((acc, element) => {
        return acc + Number(element.price) * Number(element.quantity);
      }, 0)
      .toFixed(2);

    const dbOrderValue = await Product.getOrderValue(cart);
    if (Number(userCartValue) !== Number(dbOrderValue)) {
      throw new Error("Server side error appeared while calc order values");
    }
    const productsUnavaliable = await Product.checkIfProductsAreAvaliable(cart);

    if (productsUnavaliable.length > 0) {
      const payload = {
        message: "One or more of the products is no longe avaliable",
        products: productsUnavaliable,
      };
      const response = await JSON.stringify(payload);

      res.status(406).send(response);
    } else {
      const order = new Order(userId, cart, userAddress);
      order.saveOrder();
      res.status(200).send();
    }
  } catch (err) {
    console.log(err);
    const error = new Error("Error occured, try again later");
    res.status(500).send(error);
  }
};
exports.getUserOrders = async (req, res, next) => {
  try {
    const token = checkForToken(req);
    if (token === null) {
      throw new Error("Unauthorized user");
    }

    const tokenVerification = await jwt.verify(token, tokenSecret);
    if (!tokenVerification) {
      throw new Error("Authentication error");
    }
    const page = req.query.page;
    const userOrders = await User.getUserOrders(tokenVerification.userId);
    const totalDocuments = await userOrders.count();

    const dataToSend = await userOrders
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
    const error = new Error("Error occured, try again later");
    res.status(500).send(error);
  }
};
exports.getUserAddresses = async (req, res, next) => {
  try {
    const token = checkForToken(req);
    if (token === null) {
      throw new Error("Unauthorized user");
    }

    const tokenVerification = await jwt.verify(token, tokenSecret);
    if (!tokenVerification) {
      throw new Error("Authentication error");
    }

    const userAddresses = await User.getUserAddresses(tokenVerification.userId);
    res.status(200).send(await JSON.stringify(userAddresses));
  } catch (err) {
    console.log(err);
    const error = new Error("Error occured, try again later");
    res.status(500).send(error);
  }
};
exports.addUserAddress = async (req, res, next) => {
  try {
    const token = checkForToken(req);
    if (token === null) {
      throw new Error("Unauthorized user");
    }

    const tokenVerification = await jwt.verify(token, tokenSecret);
    if (!tokenVerification) {
      throw new Error("Authorization error");
    }

    const payload = {
      name: req.body.name,
      surname: req.body.surname,
      address: req.body.address,
    };
    const modifiedCount = await User.addNewAddress(
      tokenVerification.userId,
      payload
    );
    if (modifiedCount !== 1) {
      throw Error("Coundt update address");
    }
    const newUserAddresses = await User.getUserAddresses(
      tokenVerification.userId
    );
    const newUserAddressesJson = await JSON.stringify(newUserAddresses);
    res.status(200).send(newUserAddressesJson);
  } catch (err) {
    console.log(err);
    const error = new Error("Error occured, try again later");
    res.status(500).send(error);
  }
};
exports.updateDefaultUserAddress = async (req, res, next) => {
  try {
    const token = checkForToken(req);
    if (token === null) {
      throw new Error("Unauthorized user");
    }
    const tokenVerification = await jwt.verify(token, tokenSecret);
    if (!tokenVerification) {
      throw new Error("Authorization error");
    }

    const payload = req.body.address;

    const modifiedCount = await User.updateDefaultUserAddress(
      tokenVerification.userId,
      payload
    );
    if (modifiedCount === 1) {
      res.status(200).send();
    } else throw Error("Coundt update last used  address");
  } catch (err) {
    console.log(err);
    const error = new Error("Error occured, try again later");
    res.status(500).send(error);
  }
};
