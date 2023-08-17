const mongoose = require('mongoose');

const datasetSchema = new mongoose.Schema({
	path: {
		type: String,
		required: [true, "File is required."],
	},
	type: {
		type: String,
		enum: ["target", "processing"],
		required: [true, "Please Specify the dataset type."]
	}
}, { timestamps: true });

module.exports = mongoose.model('Dataset', datasetSchema);