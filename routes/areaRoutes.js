const express = require("express");
const router = express.Router();
const {
  getAreas,
  createArea,
  updateArea,
  deleteArea
} = require("../controllers/areaController");

router.route("/")
  .get(getAreas)
  .post(createArea);

router.route("/:id")
  .put(updateArea)
  .delete(deleteArea);

module.exports = router;
