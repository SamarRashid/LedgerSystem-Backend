const Supplier = require("../models/Supplier");

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Public
const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    const formattedSuppliers = suppliers.map(s => ({
      id: s._id,
      code: s.code,
      nameEnglish: s.nameEnglish,
      nameUrdu: s.nameUrdu,
      phone: s.phone,
      address: s.address,
      openingBalance: s.openingBalance,
      status: s.status
    }));
    res.status(200).json({ success: true, data: formattedSuppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a supplier
// @route   POST /api/suppliers
// @access  Public
const createSupplier = async (req, res) => {
  try {
    const { code, nameEnglish, nameUrdu, phone, address, openingBalance, status } = req.body;
    
    // Check if code exists
    const supplierExists = await Supplier.findOne({ code });
    if (supplierExists) {
      return res.status(400).json({ success: false, message: "Supplier code already exists" });
    }

    const s = await Supplier.create({
      code,
      nameEnglish,
      nameUrdu,
      phone,
      address,
      openingBalance,
      status
    });

    const supplier = {
      id: s._id,
      code: s.code,
      nameEnglish: s.nameEnglish,
      nameUrdu: s.nameUrdu,
      phone: s.phone,
      address: s.address,
      openingBalance: s.openingBalance,
      status: s.status
    };

    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a supplier
// @route   PUT /api/suppliers/:id
// @access  Public
const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }

    const s = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    const updatedSupplier = {
      id: s._id,
      code: s.code,
      nameEnglish: s.nameEnglish,
      nameUrdu: s.nameUrdu,
      phone: s.phone,
      address: s.address,
      openingBalance: s.openingBalance,
      status: s.status
    };

    res.status(200).json({ success: true, data: updatedSupplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a supplier
// @route   DELETE /api/suppliers/:id
// @access  Public
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }

    await supplier.deleteOne();
    res.status(200).json({ success: true, message: "Supplier removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
