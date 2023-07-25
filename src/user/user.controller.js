const ErrorHandler = require("../../utils/errorHandler");
const catchAsyncError = require("../../utils/catchAsyncError");
const APIFeatures = require("../../utils/apiFeatures");
const bcrypt = require("bcryptjs");
const generateOTP = require("../../utils/otpGenerator");
const sendEmail = require("../../utils/sendEmail");
const { userModel, otpModel } = require("./user.model");

const sendData = (user, statusCode, res) => {
  const token = user.getJWTToken();

  console.log({ user });
  res.status(statusCode).json({
    user,
    token,
  });
};

// Create a new document
exports.createUser = catchAsyncError(async (req, res, next) => {
  const user = await userModel.create(req.body);
  sendData(user, 201, res);
});

// login
exports.login = catchAsyncError(async (req, res, next) => {
  console.log("user login", req.body);
  const { email, password } = req.body;

  if (!email || !password)
    return next(new ErrorHandler("Please enter your email and password", 400));

  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched)
    return next(new ErrorHandler("Invalid email or password!", 401));

  sendData(user, 200, res);
});

// get profile
exports.getProfile = catchAsyncError(async (req, res, next) => {
  console.log("user profile", req.userId);

  const user = await userModel.findById(req.userId);
  if (!user) {
    return next(new ErrorHandler("User not found.", 400));
  }

  res.status(200).json({
    user,
  });
});

// edit profile
exports.updateProfile = catchAsyncError(async (req, res, next) => {
  const userId = req.userId;

  if (req.body.password) {
    if (req.body.password.length < 8) {
      return next(new ErrorHandler("Password must have at least 8 characters.", 400));
    }

    var re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d!@#$%^&*(){}[\]<>]).*$/;
    if (!re.test(req.body.password)) {
      return next(new ErrorHandler("Password must include at least one uppercase, one lowercase, and one number or symbol - !@#$%^&*(){}[]<>", 400));
    }

    req.body.password = await bcrypt.hash(req.body.password, 11);
  }

  const user = await userModel.findByIdAndUpdate(userId, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  if (!user) return next(new ErrorHandler('User not found', 404));

  res.status(200).json({ user });
});

exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  if (!req.body.email) {
    return next(new ErrorHandler("Please enter a valid email.", 400));
  }
  console.log("forgot password", req.body.email);

  const user = await userModel.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // get resetPassword OTP
  const otp = generateOTP();

  const otpInstance = await otpModel.findOne({ email: user.email });
  if (!otpInstance) {
    await otpModel.create({ otp, email: user.email });
  } else {
    otpInstance.otp = otp;
    await otpInstance.save();
  }

  const message = `<b>Your password reset OTP is :- <h2>${otp}</h2></b>This OTP is valid for 15 minutes.</b><div>If you have not requested this email then, please ignore it.</div>`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Password Reset`,
      message,
    });

    res.status(200).json({
      message: `Email sent to ${user.email} successfully.`,
    });
  } catch (error) {
    await otpModel.deleteOne({ otp: otp, email: user.email });
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.verifyOTP = catchAsyncError(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new ErrorHandler("Please provide email and otp.", 400));
  }

  console.log({ otp, email });
  const otpInstance = await otpModel.findOne({ otp, email });

  if (!otpInstance || !(await otpInstance.is_valid())) {
    if (otpInstance) {
      await otpInstance.deleteOne();
    }
    return next(new ErrorHandler("OTP is invalid or has been expired.", 400));
  }

  await otpInstance.deleteOne();

  res.status(200).json({
    message: "OTP verified successfully."
  });
});

exports.updatePassword = catchAsyncError(async (req, res, next) => {
  const { email, password, confirmPassword } = req.body;
  if (!email)
    return next(new ErrorHandler("Please provide the email.", 400));

  if (!password || !confirmPassword)
    return next(new ErrorHandler("Password or Confirm Password is required.", 400));

  if (password !== confirmPassword)
    return next(new ErrorHandler("Please confirm your password,", 400));

  const user = await userModel.findOne({ email });
  if (!user) return next(new ErrorHandler("User Not Found.", 404));

  user.password = password;
  await user.save();

  res.status(200).json({ message: "Password Updated Successfully." });
});

// Get all documents
exports.getAllUser = catchAsyncError(async (req, res, next) => {
  const userCount = await userModel.countDocuments();
  console.log("userCount", userCount);
  const apiFeature = new APIFeatures(
    userModel.find().sort({ createdAt: -1 }),
    req.query
  ).search("fullname");

  let users = await apiFeature.query;
  console.log("users", users);
  let filteredUserCount = users.length;
  if (req.query.resultPerPage && req.query.currentPage) {
    apiFeature.pagination();

    console.log("filteredUserCount", filteredUserCount);
    users = await apiFeature.query.clone();
  }
  console.log("users", users);
  res.status(200).json({ users, userCount, filteredUserCount });
});

// Get a single document by ID
exports.getUser = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const user = await userModel.findById(id);
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  res.status(200).json({ user });
});

// Update a document by ID
exports.updateUser = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const user = await userModel.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  if (!user) return next(new ErrorHandler('User not found', 404));

  res.status(200).json({ user });
});

// Delete a document by ID
exports.deleteUser = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  let user = await userModel.findById(id);

  if (!user)
    return next(new ErrorHandler("User not found", 404));

  await user.deleteOne();

  res.status(200).json({
    message: "User Deleted successfully.",
  });
});
