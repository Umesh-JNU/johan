const ErrorHandler = require("../../utils/errorHandler");
const catchAsyncError = require("../../utils/catchAsyncError");
const APIFeatures = require("../../utils/apiFeatures");
const datasetModel = require("./dataset.model");
const { isValidObjectId } = require("mongoose");
const axios = require('axios');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { s3Uploadv2 } = require("../../utils/s3");
const fs = require('fs');
const path = require("path");

// upload file
const uploadFile = async (file) => {
  const results = await s3Uploadv2(file);
  const location = results.Location && results.Location;
  return location;
};

// Create a new document
exports.createDataset = catchAsyncError(async (req, res, next) => {
  const file = req.file;
  if (!file) return next(new ErrorHandler("Invalid File", 401));

  const fileURL = await uploadFile(file, next);
  if (!fileURL) {
    return next(new ErrorHandler("Something went wrong while uploading file.", 400));
  }

  console.log({})
  return res.send(file);
  const results = await s3Uploadv2(file);
  const location = results.Location && results.Location;
  return res.status(201).json({ data: { location } });
  const dataset = await datasetModel.create(req.body);
  res.status(201).json({ dataset });
});

// Get all documents
exports.getAllDataset = catchAsyncError(async (req, res, next) => {
  const target = await datasetModel.find({ type: "target" }).sort({ createdAt: -1 })
  const processing = await datasetModel.find({ type: "processing" }).sort({ createdAt: -1 })

  res.status(200).json({ target, processing });
});

// Get a single document by ID
const getFile = async (id, type, next) => {
  // if (!isValidObjectId(id)) {
  //   return next(new ErrorHandler(`Invalid ${type} Dataset ID`, 400));
  // }

  // const file = await datasetModel.findById(id);
  // if (!file) {
  //   return next(new ErrorHandler(`${type} Dataset Not Found.`, 404));
  // }

  const filepath = path.join(__dirname + "/PitchAziDepth.txt");
  const xy = [];
  const yz = [];
  const zx = [];
  const data = fs.readFileSync(filepath, "utf-8");
  const csvStream = Readable.from(data);

  await new Promise((resolve, reject) => {
    csvStream
      .pipe(csv(['X', 'Y', 'Z']))
      .on('data', (row) => {
        xy.push({ x: row.X, y: row.Y });
        yz.push({ y: row.Y, z: row.Z });
        zx.push({ z: row.Z, x: row.X });
      })
      .on('end', () => {
        resolve();
      })
      .on('error', (error) => {
        reject(error);
      });
  });

  if (xy.length === 0 || yz.length === 0 || zx.length === 0)
    throw new ErrorHandler("Something went wrong", 400);

  return { xy, yz, zx };
};

exports.getDataset = catchAsyncError(async (req, res, next) => {
  console.log("get dataset");
  const { targetID, processingID } = req.query;
  if (!targetID && !processingID) {
    return next(new ErrorHandler("Missing target and processing dataset IDs.", 400));
  }

  // if (targetID) {
  //   const target = await getFile(targetID, "Target", next);
  // }

  // if (processingID) {
  //   const processing = await getFile(processingID, "Processing", next);
  // }
  const data = await getFile(targetID, "Target", next);
  res.status(200).json({ data });
});

exports.searchValue = catchAsyncError(async (req, res, next) => {
  // const { data } = await axios.get(req.body.url);
  const { X, Y, Z } = req.query;
  console.log(req.query);
  const filepath = path.join(__dirname + "/PitchAziDepth.txt");
  fs.readFile(filepath, "utf-8", (err, data) => {
    if (err) throw new ErrorHandler(err.message, 400);

    const csvStream = Readable.from(data);
    csvStream
      .pipe(csv(['X', 'Y', 'Z']))
      .on('data', (row) => {
        if (X === row.X && Y === row.Y) {
          return res.status(200).json({ Z: row.Z });
        }
        if (Y === row.Y && Z === row.Z) {
          return res.status(200).json({ X: row.X });
        }
        if (X === row.X && Z === row.Z) {
          return res.status(200).json({ Y: row.Y });
        }
      })
      .on('end', () => {
        res.status(200).json({ message: 'No matching entries found.' });
      });
  });
});
