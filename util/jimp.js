const deleteImage = require("./fs.js").deleteFile;
const readStream = require("fs").createReadStream;
const SMALL_IMAGE_SIZE = 128;
const MEDIUM_IMAGE_SIZE = 250;
const LARGE_IMAGE_SIZE = 720;
const AWS = require("aws-sdk");
const AWS_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET = process.env.AWS_SECRET_ACCESS_KEY;
const s3 = new AWS.S3({
  region: "eu-central-1",
  accessKeyId: AWS_ID,
  secretAccessKey: AWS_SECRET,
});

// JIMP WONT WORK ON HEROKU SINCE IT DOESN'T ALLOW DYNAMIC FILES UPLOADING
const Jimp = require("jimp");
const uploadImageToAws = (file) => {
  const nameOfFile = "S-" + file.split("images/")[1];
  const fileStream = readStream(file);
  const uploadParams = {
    Bucket: "taimen-shop",
    Key: nameOfFile,
    Body: fileStream,
  };
  return s3.upload(uploadParams).promise();
};
const createSmallImage = async (imageToResize) => {
  try {
    /*  const image = await Jimp.read(imageToResize); 
    const nameOfFile = "S-" + imageToResize.split("/")[1];
    const realtivePath = imageToResize.replace(
      imageToResize.split("/")[1],
      nameOfFile
    ); 
     await image.resize(SMALL_IMAGE_SIZE, Jimp.AUTO); 
       await image.writeAsync(realtivePath);*/

    const data = await uploadImageToAws(imageToResize);

    return data.Location;
  } catch (err) {
    console.log(err);
  }
};
const createMediumImage = async (imageToResize) => {
  try {
    /*   const image = await Jimp.read(imageToResize);
    const nameOfFile = "M-" + imageToResize.split("/")[1];
    const realtivePath = imageToResize.replace(
      imageToResize.split("/")[1],
      nameOfFile
    );
    await image.resize(MEDIUM_IMAGE_SIZE, Jimp.AUTO); */

    const data = await uploadImageToAws(imageToResize);
    return data.Location;
  } catch (err) {
    console.log(err);
  }
};
const createLargeImage = async (imageToResize) => {
  try {
    /*    const image = await Jimp.read(imageToResize);
    const nameOfFile = "L-" + imageToResize.split("/")[1];
    const realtivePath = imageToResize.replace(
      imageToResize.split("/")[1],
      nameOfFile
    );
    await image.resize(LARGE_IMAGE_SIZE, Jimp.AUTO); */

    const data = await uploadImageToAws(imageToResize);

    return data.Location;
  } catch (err) {
    console.log(err);
  }
};

exports.createResizedImages = async (imageToResize) => {
  const smallImagePath = await createSmallImage(imageToResize);
  if (!smallImagePath) {
    throw new Error("No images");
  }
  /* const mediumImagePath = await createMediumImage(imageToResize);
  const largeImagePath = await createLargeImage(imageToResize); */

  const imagesPath = {
    small: smallImagePath,
    medium: smallImagePath,
    large: smallImagePath,
  };
  /* await deleteImage(imageToResize); */
  return imagesPath;
};
