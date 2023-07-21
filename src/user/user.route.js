const express = require("express");
const router = express.Router();
const { auth } = require("../../middlewares/auth");
const { createUser, getAllUser, getUser, updateUser, deleteUser, login, getProfile, updateProfile, forgotPassword, verifyOTP, updatePassword } = require("./user.controller");

router.post("/register", createUser);
router.post("/login", login);
router.get("/profile", auth, getProfile);
router.put("/update-profile", auth, updateProfile);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.put("/reset-password", updatePassword);

router.post("/", getAllUser);
router.route("/:id")
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);
  
module.exports = router;
