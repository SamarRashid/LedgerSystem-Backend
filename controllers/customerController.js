const Customer = require("../models/Customer");

// @desc    Get all customers
// @route   GET /api/customers
// @access  Public
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    // Transform _id to id for the frontend if needed, or frontend can use _id
    const formattedCustomers = customers.map(c => ({
      id: c._id,
      code: c.code,
      nameEnglish: c.nameEnglish,
      nameUrdu: c.nameUrdu,
      phone: c.phone,
      address: c.address,
      openingBalance: c.openingBalance,
      status: c.status
    }));
    res.status(200).json({ success: true, data: formattedCustomers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a customer
// @route   POST /api/customers
// @access  Public
const createCustomer = async (req, res) => {
  try {
    const { code, nameEnglish, nameUrdu, phone, address, openingBalance, status } = req.body;
    
    // Check if code exists
    const customerExists = await Customer.findOne({ code });
    if (customerExists) {
      return res.status(400).json({ success: false, message: "Customer code already exists" });
    }

    const c = await Customer.create({
      code,
      nameEnglish,
      nameUrdu,
      phone,
      address,
      openingBalance,
      status
    });

    const customer = {
      id: c._id,
      code: c.code,
      nameEnglish: c.nameEnglish,
      nameUrdu: c.nameUrdu,
      phone: c.phone,
      address: c.address,
      openingBalance: c.openingBalance,
      status: c.status
    };

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Public
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const c = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    const updatedCustomer = {
      id: c._id,
      code: c.code,
      nameEnglish: c.nameEnglish,
      nameUrdu: c.nameUrdu,
      phone: c.phone,
      address: c.address,
      openingBalance: c.openingBalance,
      status: c.status
    };

    res.status(200).json({ success: true, data: updatedCustomer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Public
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    await customer.deleteOne();
    res.status(200).json({ success: true, message: "Customer removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
