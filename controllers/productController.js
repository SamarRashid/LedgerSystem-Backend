const { supabase } = require("../config/db");

// Format product for frontend
const formatProduct = (p) => ({
  id: p.id,
  code: p.code,
  nameEnglish: p.nameEnglish,
  nameUrdu: p.nameUrdu,
  category: p.category,
  purchasePrice: p.purchasePrice,
  salePrice: p.salePrice,
  unit: p.unit,
  status: p.status,
});

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: (data || []).map(formatProduct),
    });
  } catch (error) {
    console.error("Get products error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Public
const createProduct = async (req, res) => {
  try {
    const {
      code,
      nameEnglish,
      nameUrdu,
      category,
      purchasePrice,
      salePrice,
      unit,
      status,
    } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Product code is required",
      });
    }

    // Check if product code already exists
    const { data: existingProduct, error: checkError } = await supabase
      .from("products")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Product code already exists",
      });
    }

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          code,
          nameEnglish,
          nameUrdu,
          category,
          purchasePrice: Number(purchasePrice || 0),
          salePrice: Number(salePrice || 0),
          unit,
          status: status || "Active",
        },
      ])
      .select("*")
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      data: formatProduct(data),
    });
  } catch (error) {
    console.error("Create product error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Public
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existingProduct, error: findError } = await supabase
      .from("products")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (findError) throw findError;

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const allowedFields = [
      "code",
      "nameEnglish",
      "nameUrdu",
      "category",
      "purchasePrice",
      "salePrice",
      "unit",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.purchasePrice !== undefined) {
      updates.purchasePrice = Number(updates.purchasePrice);
    }

    if (updates.salePrice !== undefined) {
      updates.salePrice = Number(updates.salePrice);
    }

    // Prevent duplicate product codes
    if (updates.code) {
      const { data: duplicate, error: duplicateError } = await supabase
        .from("products")
        .select("id")
        .eq("code", updates.code)
        .neq("id", id)
        .maybeSingle();

      if (duplicateError) throw duplicateError;

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Product code already exists",
        });
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided to update",
      });
    }

    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: formatProduct(data),
    });
  } catch (error) {
    console.error("Update product error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Public
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: product, error: findError } = await supabase
      .from("products")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (findError) throw findError;

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return res.status(200).json({
      success: true,
      message: "Product removed",
    });
  } catch (error) {
    console.error("Delete product error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};