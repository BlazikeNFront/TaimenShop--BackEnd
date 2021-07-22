const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const admin = require("../controllers/admin.js");
const productController = require("../controllers/ProductController.js");
const userController = require("../controllers/UserActionsController.js");

//admin
router.post("/admin/addProduct", admin.addProduct);
router.get("/admin/getOrders", admin.getOrders);
router.post("/admin/changeOrderStatus/", admin.changeOrderStatus);
//authRoutes
router.post("/SignUp", userController.signUp);
router.post(
  "/userAuth",
  body("email").isEmail(),
  body("password").custom((value) => {
    //Requirements -minimum eight characters, at least one letter and one number
    const regexForPassword = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (regexForPassword.test(value) === false) {
      const error = new Error(
        "Password should be minimum eight characters,contain one letter and one number"
      );
      throw error;
    }
  }),
  userController.userAuth
);
router.get("/authWithCookie", userController.userCookieAuth);
router.post(
  "/addUserAddress",
  body("name").custom((value) => {
    const regexOnlyLetters = /^[A-Za-z'/s]+$/;
    if (regexOnlyLetters.test(value) === false) {
      const error = new Error(
        "Name should be at least 2 letters and also not contain special chars like &?"
      );
      throw error;
    }
  }),
  body("surname").custom((value) => {
    const regexOnlyLetters = /^[A-Za-z'/s]+$/;
    if (regexOnlyLetters.test(value) === false) {
      const error = new Error(
        "Surname should be at least 2 letters and also not contain special chars like &?"
      );
      throw error;
    }
  }),
  body("address").custom((value) => {
    const regexForAddress = /^[\sA-Za-z0-9-']+$/;
    if (regexForAddress.test(value) === false) {
      const error = new Error(
        "Surname field should contain at least 5 characters and also not contain special signs like ?,&"
      );
      throw error;
    }
  }),
  userController.addUserAddress
);
router.post("/updateUserCart", userController.updateUserCart);
router.post("/confirmOrder", userController.confirmOrder);
router.get("/getUserAddresses", userController.getUserAddresses);
router.post(
  "/updateDefaultUserAddress",
  userController.updateDefaultUserAddress
);

//products
router.get("/searchProducts/:query", productController.userSearch);
router.get("/getProductDetails/:prodId", productController.getProductDetail);
router.get("/getUserCart", userController.getUserCart);
router.get("/getUserOrders", userController.getUserOrders);

module.exports = router;
