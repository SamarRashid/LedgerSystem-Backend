const express = require("express");

const {
getSuppliers,
createSupplier,
updateSupplier,
deleteSupplier,
} = require("../controllers/supplierController");

const router = express.Router();

// GET ALL SUPPLIERS
router.get("/", getSuppliers);

// CREATE SUPPLIER
router.post("/", createSupplier);

// UPDATE SUPPLIER
router.put("/:id", updateSupplier);

// DELETE SUPPLIER
router.delete("/:id", deleteSupplier);

module.exports = router;
