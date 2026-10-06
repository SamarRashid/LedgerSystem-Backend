const { supabase } = require("../config/db");

// Convert Supabase database fields to frontend field names
const formatCustomer = (c) => ({
  id: c.id,
  code: c.customer_code,
  nameEnglish: c.name_en,
  nameUrdu: c.name_ur,
  phone: c.phone,
  phone2: c.phone2,
  address: c.address,
  openingBalance: c.opening_balance,
  status: c.status,
  createdAt: c.created_at,
  updatedAt: c.updated_at,
});

// @desc Get all customers
// @route GET /api/customers
const getCustomers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: (data || []).map(formatCustomer),
    });
  } catch (error) {
    console.error("Get customers error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Create a customer
// @route POST /api/customers
const createCustomer = async (req, res) => {
  try {
    const {
      code,
      customer_code,
      nameEnglish,
      name_en,
      nameUrdu,
      name_ur,
      phone,
      phone2,
      address,
      openingBalance,
      opening_balance,
      status,
    } = req.body;

    const customerCode = customer_code ?? code;
    const englishName = name_en ?? nameEnglish;
    const urduName = name_ur ?? nameUrdu;
    const balance = Number(opening_balance ?? openingBalance ?? 0);

    if (!customerCode || !String(customerCode).trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer code is required",
      });
    }

    if (!englishName || !String(englishName).trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer English name is required",
      });
    }

    if (!Number.isFinite(balance)) {
      return res.status(400).json({
        success: false,
        message: "Opening balance must be a valid number",
      });
    }

    const { data: existingCustomer, error: checkError } = await supabase
      .from("customers")
      .select("id")
      .eq("customer_code", String(customerCode).trim())
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Customer code already exists",
      });
    }

    const customerData = {
      customer_code: String(customerCode).trim(),
      name_en: String(englishName).trim(),
      name_ur: urduName || null,
      phone: phone || null,
      phone2: phone2 || null,
      address: address || null,
      opening_balance: balance,
      status: status || "Active",
    };

    const { data, error } = await supabase
      .from("customers")
      .insert([customerData])
      .select("*")
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      data: formatCustomer(data),
    });
  } catch (error) {
    console.error("Create customer error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Update a customer
// @route PUT /api/customers/:id
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existingCustomer, error: findError } = await supabase
      .from("customers")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (findError) throw findError;

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const body = req.body;
    const updates = {};

    const fieldMap = {
      code: "customer_code",
      customer_code: "customer_code",
      nameEnglish: "name_en",
      name_en: "name_en",
      nameUrdu: "name_ur",
      name_ur: "name_ur",
      phone: "phone",
      phone2: "phone2",
      address: "address",
      status: "status",
      openingBalance: "opening_balance",
      opening_balance: "opening_balance",
    };

    for (const [inputField, dbField] of Object.entries(fieldMap)) {
      if (body[inputField] !== undefined) {
        let value = body[inputField];

        if (dbField === "opening_balance") {
          value = Number(value);

          if (!Number.isFinite(value)) {
            return res.status(400).json({
              success: false,
              message: "Opening balance must be a valid number",
            });
          }
        }

        updates[dbField] = value;
      }
    }

    if (
      updates.customer_code !== undefined &&
      !String(updates.customer_code).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Customer code cannot be empty",
      });
    }

    if (
      updates.name_en !== undefined &&
      !String(updates.name_en).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Customer English name cannot be empty",
      });
    }

    if (updates.customer_code !== undefined) {
      updates.customer_code = String(updates.customer_code).trim();

      const { data: duplicate, error: duplicateError } = await supabase
        .from("customers")
        .select("id")
        .eq("customer_code", updates.customer_code)
        .neq("id", id)
        .maybeSingle();

      if (duplicateError) throw duplicateError;

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Customer code already exists",
        });
      }
    }

    if (updates.name_en !== undefined) {
      updates.name_en = String(updates.name_en).trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided to update",
      });
    }

    const { data, error } = await supabase
      .from("customers")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: formatCustomer(data),
    });
  } catch (error) {
    console.error("Update customer error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Delete a customer
// @route DELETE /api/customers/:id
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: customer, error: findError } = await supabase
      .from("customers")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (findError) throw findError;

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const { error: deleteError } = await supabase
      .from("customers")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete customer error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};