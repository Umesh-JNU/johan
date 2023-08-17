const datasetModel = require("./dataset.model");
const { createDataset, getAllDataset, getDataset, searchValue } = require("./dataset.controller");
const dataRoute = require("./dataset.route");

module.exports = { datasetModel, createDataset, getAllDataset, getDataset, searchValue, dataRoute };
