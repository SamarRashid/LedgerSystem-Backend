const { supabase } = require("../config/db");

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Public
const getExpenses = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get expenses error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Public
const createExpense = async (req, res) => {
  try {
    const {
      code,
      nameEnglish,
      nameUrdu,
      calculationType,
      rate,
      sellerApplicable,
      buyerApplicable,
      status,
    } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Expense code is required",
      });
    }

    // Check duplicate expense code
    const { data: existingExpense, error: checkError } = await supabase
      .from("expenses")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingExpense) {
      return res.status(400).json({
        success: false,
        message: `Expense code ${code} already exists`,
      });
    }

    const { data: expense, error } = await supabase
      .from("expenses")
      .insert([
        {
          code,
          nameEnglish,
          nameUrdu,
          calculationType,
          rate: Number(rate || 0),
          sellerApplicable: Boolean(sellerApplicable),
          buyerApplicable: Boolean(buyerApplicable),
          status: status || "Active",
        },
      ])
      .select("*")
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Create expense error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Public
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: expense, error: findError } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (findError) throw findError;

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    // Check whether the updated code is already in use
    if (req.body.code && req.body.code !== expense.code) {
      const { data: codeExists, error: checkError } = await supabase
        .from("expenses")
        .select("id")
        .eq("code", req.body.code)
        .neq("id", id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (codeExists) {
        return res.status(400).json({
          success: false,
          message: `Expense code ${req.body.code} already exists`,
        });
      }
    }

    // Only accept supported fields
    const allowedFields = [
      "code",
      "nameEnglish",
      "nameUrdu",
      "calculationType",
      "rate",
      "sellerApplicable",
      "buyerApplicable",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.rate !== undefined) {
      updates.rate = Number(updates.rate);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided to update",
      });
    }

    const { data: updatedExpense, error: updateError } = await supabase
      .from("expenses")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: updatedExpense,
    });
  } catch (error) {
    console.error("Update expense error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Public
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: expense, error: findError } = await supabase
      .from("expenses")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (findError) throw findError;

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    const { error: deleteError } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
      data: {},
    });
  } catch (error) {
    console.error("Delete expense error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};