const express = require("express");
const router = express.Router();
const { createDataset, getAllDataset, getDataset, searchValue } = require("./dataset.controller");
const { upload } = require("../../utils/s3");

router.post("/upload", upload.single("csv"), createDataset);
router.get("/all", getAllDataset);
router.get("/", getDataset);
router.get("/search", searchValue);
  
module.exports = router;
