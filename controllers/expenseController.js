const Expense = require('../models/expenseModel');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Public
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Public
const createExpense = async (req, res) => {
  try {
    const { code, nameEnglish, nameUrdu, calculationType, rate, sellerApplicable, buyerApplicable, status } = req.body;

    const expenseExists = await Expense.findOne({ code });
    if (expenseExists) {
      return res.status(400).json({ success: false, message: `Expense code ${code} already exists` });
    }

    const expense = await Expense.create({
      code,
      nameEnglish,
      nameUrdu,
      calculationType,
      rate,
      sellerApplicable,
      buyerApplicable,
      status
    });

    res.status(201).json({ success: true, message: 'Expense created successfully', data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Public
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    // Check if updating code to an existing one
    if (req.body.code && req.body.code !== expense.code) {
      const codeExists = await Expense.findOne({ code: req.body.code });
      if (codeExists) {
        return res.status(400).json({ success: false, message: `Expense code ${req.body.code} already exists` });
      }
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Expense updated successfully', data: updatedExpense });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Public
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    await expense.deleteOne();
    res.status(200).json({ success: true, message: 'Expense deleted successfully', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense
};
