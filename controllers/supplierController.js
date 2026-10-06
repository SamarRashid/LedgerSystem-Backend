const { supabase } = require("../config/db");

// Helper: Format supplier response
const formatSupplier = (s) => ({
  id: s.id,
  code: s.code,
  nameEnglish: s.nameEnglish,
  nameUrdu: s.nameUrdu,
  phone: s.phone || "",
  address: s.address || "",
  openingBalance: Number(s.openingBalance || 0),
  status: s.status || "Active",
});

// GET ALL SUPPLIERS
// GET /api/suppliers
const getSuppliers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("suppliers")
      .select(`
        id,
        code,
        nameEnglish,
        nameUrdu,
        phone,
        address,
        openingBalance,
        status,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: (data || []).map(formatSupplier),
    });
  } catch (error) {
    console.error("Get suppliers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch suppliers",
      error: error.message,
    });
  }
};

// CREATE SUPPLIER
// POST /api/suppliers
const createSupplier = async (req, res) => {
  try {
    const {
      code,
      nameEnglish,
      nameUrdu,
      phone,
      address,
      openingBalance,
      status,
    } = req.body;

    if (
      typeof code !== "string" ||
      !code.trim() ||
      typeof nameEnglish !== "string" ||
      !nameEnglish.trim() ||
      typeof nameUrdu !== "string" ||
      !nameUrdu.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Code, English name and Urdu name are required",
      });
    }

    const cleanCode = code.trim();

    const balance =
      openingBalance === undefined || openingBalance === ""
        ? 0
        : Number(openingBalance);

    if (!Number.isFinite(balance)) {
      return res.status(400).json({
        success: false,
        message: "Opening balance must be a valid number",
      });
    }

    const { data: existing, error: checkError } = await supabase
      .from("suppliers")
      .select("id")
      .eq("code", cleanCode)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Supplier code already exists",
      });
    }

    const { data: supplier, error } = await supabase
      .from("suppliers")
      .insert({
        code: cleanCode,
        nameEnglish: nameEnglish.trim(),
        nameUrdu: nameUrdu.trim(),
        phone: phone || "",
        address: address || "",
        openingBalance: balance,
        status: status || "Active",
      })
      .select(`
        id,
        code,
        nameEnglish,
        nameUrdu,
        phone,
        address,
        openingBalance,
        status,
        created_at,
        updated_at
      `)
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: formatSupplier(supplier),
    });
  } catch (error) {
    console.error("Create supplier error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create supplier",
      error: error.message,
    });
  }
};

// UPDATE SUPPLIER
// PUT /api/suppliers/:id
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      code,
      nameEnglish,
      nameUrdu,
      phone,
      address,
      openingBalance,
      status,
    } = req.body;

    const { data: existing, error: findError } = await supabase
      .from("suppliers")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (findError) throw findError;

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    const updateData = {};

    if (code !== undefined) {
      if (typeof code !== "string" || !code.trim()) {
        return res.status(400).json({
          success: false,
          message: "Supplier code cannot be empty",
        });
      }

      updateData.code = code.trim();
    }

    if (nameEnglish !== undefined) {
      if (typeof nameEnglish !== "string" || !nameEnglish.trim()) {
        return res.status(400).json({
          success: false,
          message: "English name cannot be empty",
        });
      }

      updateData.nameEnglish = nameEnglish.trim();
    }

    if (nameUrdu !== undefined) {
      if (typeof nameUrdu !== "string" || !nameUrdu.trim()) {
        return res.status(400).json({
          success: false,
          message: "Urdu name cannot be empty",
        });
      }

      updateData.nameUrdu = nameUrdu.trim();
    }

    if (phone !== undefined) updateData.phone = phone || "";
    if (address !== undefined) updateData.address = address || "";
    if (status !== undefined) updateData.status = status;

    if (openingBalance !== undefined) {
      const balance = Number(openingBalance);

      if (!Number.isFinite(balance)) {
        return res.status(400).json({
          success: false,
          message: "Opening balance must be a valid number",
        });
      }

      updateData.openingBalance = balance;
    }

    if (updateData.code && updateData.code !== existing.code) {
      const { data: duplicate, error: duplicateError } = await supabase
        .from("suppliers")
        .select("id")
        .eq("code", updateData.code)
        .neq("id", id)
        .maybeSingle();

      if (duplicateError) throw duplicateError;

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Supplier code already exists",
        });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const { data: updated, error: updateError } = await supabase
      .from("suppliers")
      .update(updateData)
      .eq("id", id)
      .select(`
        id,
        code,
        nameEnglish,
        nameUrdu,
        phone,
        address,
        openingBalance,
        status,
        created_at,
        updated_at
      `)
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      data: formatSupplier(updated),
    });
  } catch (error) {
    console.error("Update supplier error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update supplier",
      error: error.message,
    });
  }
};

// DELETE SUPPLIER
// DELETE /api/suppliers/:id
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: supplier, error: findError } = await supabase
      .from("suppliers")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (findError) throw findError;

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    const { error: deleteError } = await supabase
      .from("suppliers")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return res.status(200).json({
      success: true,
      message: "Supplier removed successfully",
    });
  } catch (error) {
    console.error("Delete supplier error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete supplier",
      error: error.message,
    });
  }
};

module.exports = {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};