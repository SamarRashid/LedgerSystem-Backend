const express = require("express");
const router = express.Router();

const {
  getAreas,
  createArea,
  updateArea,
  deleteArea,
} = require("../controllers/areaController");

// GET all areas and CREATE area
router.route("/")
  .get(getAreas)
  .post(createArea);

// UPDATE and DELETE area by ID
router.route("/:id")
  .put(updateArea)
  .delete(deleteArea);

module.exports = router;