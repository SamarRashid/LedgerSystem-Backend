const express = require("express");

const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

const router = express.Router();


// GET ALL USERS
router.get("/", getUsers);


// CREATE USER
router.post("/", createUser);


// UPDATE USER
router.put("/:id", updateUser);


// DELETE USER
router.delete("/:id", deleteUser);


module.exports = router;