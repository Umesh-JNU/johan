const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const validateEmail = (email) => {
	var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
	return re.test(email);
};

const validatePassword = (password) => {
	var re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d!@#$%^&*(){}[\]<>]).*$/;
	// var re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*(\d|\W)).*$/;
	return re.test(password);
};

const otpSchema = new mongoose.Schema({
	email: {
		type: String,
		required: [true, "Email is required."],
	},
	otp: {
		type: String,
		required: [true, "OTP is required."]
	}
}, { timestamps: true });

const userSchema = new mongoose.Schema({
	fullname: {
		type: String,
		required: [true, "Fullname is required."],
	},
	email: {
		type: String,
		required: [true, "Email is required."],
		unique: true,
		validate: [validateEmail, "Please fill a valid email address"]
	},
	password: {
		type: String,
		required: [true, "Password is required."],
		minLength: [8, "Password must have at least 8 characters."],
		validate: [validatePassword, "Password must include at least one uppercase, one lowercase, and one number or symbol - !@#$%^&*(){}[]<>"],
		select: false,
	},
	mobile_no: {
		type: String,
		required: [true, "Phone number is required."],
	},
	role: {
		type: String,
		default: "user",
		enum: ["user", "admin"],
	},
}, { timestamps: true });

userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) next();

	this.password = await bcrypt.hash(this.password, 11);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getJWTToken = function () {
	return jwt.sign({ userId: this._id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_TOKEN_EXPIRE,
	});
};

otpSchema.methods.is_valid = async function () {
	const user = await userModel.findOne({ email: this.email });
	console.log({ user })
	if (!user) return false;

	const otpValidityDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
	const currentTime = new Date().getTime();
	const otpCreationTime = new Date(this.createdAt).getTime();

	// Calculate the time difference between current time and OTP creation time
	const timeDifference = currentTime - otpCreationTime;

	// Check if the time difference is within the OTP validity duration
	return timeDifference <= otpValidityDuration;
};

const userModel = mongoose.model('User', userSchema);
const otpModel = mongoose.model("OTP", otpSchema);

module.exports = { userModel, otpModel };