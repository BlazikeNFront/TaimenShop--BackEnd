const mongoDB = require("mongodb");
const mongoClient = mongoDB.MongoClient;
const MONGO_URL = require("../privates.js").mongoUrl;
let _db;

const mongoConnect = () => {
  mongoClient
    .connect(MONGO_URL, { useUnifiedTopology: true })
    .then((client) => {
      _db = client.db();
      console.log("connected");
      return _db;
    })
    .catch((err) => console.log(err));
};

const getDb = () => {
  if (_db) {
    return _db;
  } else {
    const error = "No database found";
    throw new Error(error);
  }
};

exports.connectDatabase = mongoConnect;
exports.getDb = getDb;
