const Product = require("../models/Product");

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    const formattedProducts = products.map(p => ({
      id: p._id,
      code: p.code,
      nameEnglish: p.nameEnglish,
      nameUrdu: p.nameUrdu,
      category: p.category,
      purchasePrice: p.purchasePrice,
      salePrice: p.salePrice,
      unit: p.unit,
      status: p.status
    }));
    res.status(200).json({ success: true, data: formattedProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Public
const createProduct = async (req, res) => {
  try {
    const { code, nameEnglish, nameUrdu, category, purchasePrice, salePrice, unit, status } = req.body;
    
    // Check if code exists
    const productExists = await Product.findOne({ code });
    if (productExists) {
      return res.status(400).json({ success: false, message: "Product code already exists" });
    }

    const p = await Product.create({
      code,
      nameEnglish,
      nameUrdu,
      category,
      purchasePrice,
      salePrice,
      unit,
      status
    });

    const product = {
      id: p._id,
      code: p.code,
      nameEnglish: p.nameEnglish,
      nameUrdu: p.nameUrdu,
      category: p.category,
      purchasePrice: p.purchasePrice,
      salePrice: p.salePrice,
      unit: p.unit,
      status: p.status
    };

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Public
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const p = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    const updatedProduct = {
      id: p._id,
      code: p.code,
      nameEnglish: p.nameEnglish,
      nameUrdu: p.nameUrdu,
      category: p.category,
      purchasePrice: p.purchasePrice,
      salePrice: p.salePrice,
      unit: p.unit,
      status: p.status
    };

    res.status(200).json({ success: true, data: updatedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Public
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await product.deleteOne();
    res.status(200).json({ success: true, message: "Product removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
