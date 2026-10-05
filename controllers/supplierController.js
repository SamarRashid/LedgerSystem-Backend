const { supabase } = require("../config/db");


// =========================================================
// GET ALL SUPPLIERS
// GET /api/suppliers
// =========================================================

const getSuppliers = async (req, res) => {
  try {
    const { data: suppliers, error } = await supabase
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

    if (error) {
      console.error("Get suppliers error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch suppliers",
        error: error.message,
      });
    }

    const formattedSuppliers = (suppliers || []).map((s) => ({
      id: s.id,
      code: s.code,
      nameEnglish: s.nameEnglish,
      nameUrdu: s.nameUrdu,
      phone: s.phone || "",
      address: s.address || "",
      openingBalance: Number(s.openingBalance || 0),
      status: s.status || "Active",
    }));

    return res.status(200).json({
      success: true,
      data: formattedSuppliers,
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


// =========================================================
// CREATE SUPPLIER
// POST /api/suppliers
// =========================================================

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

    // Validation
    if (!code || !nameEnglish || !nameUrdu) {
      return res.status(400).json({
        success: false,
        message: "Code, English name and Urdu name are required",
      });
    }

    const cleanCode = code.trim();

    // Check duplicate code
    const {
      data: existingSupplier,
      error: checkError,
    } = await supabase
      .from("suppliers")
      .select("id")
      .eq("code", cleanCode)
      .maybeSingle();

    if (checkError) {
      console.error("Check supplier error:", checkError);

      return res.status(500).json({
        success: false,
        message: "Failed to check supplier code",
        error: checkError.message,
      });
    }

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: "Supplier code already exists",
      });
    }

    // Create supplier
    const {
      data: supplier,
      error: createError,
    } = await supabase
      .from("suppliers")
      .insert([
        {
          code: cleanCode,
          nameEnglish: nameEnglish.trim(),
          nameUrdu: nameUrdu.trim(),
          phone: phone || "",
          address: address || "",
          openingBalance: Number(openingBalance || 0),
          status: status || "Active",
        },
      ])
      .select(`
        id,
        code,
        nameEnglish,
        nameUrdu,
        phone,
        address,
        openingBalance,
        status,
        created_at
      `)
      .single();

    if (createError) {
      console.error("Create supplier error:", createError);

      return res.status(500).json({
        success: false,
        message: "Failed to create supplier",
        error: createError.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Supplier created successfully",

      data: {
        id: supplier.id,
        code: supplier.code,
        nameEnglish: supplier.nameEnglish,
        nameUrdu: supplier.nameUrdu,
        phone: supplier.phone || "",
        address: supplier.address || "",
        openingBalance: Number(supplier.openingBalance || 0),
        status: supplier.status,
      },
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


// =========================================================
// UPDATE SUPPLIER
// PUT /api/suppliers/:id
// =========================================================

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

    // Check supplier
    const {
      data: existingSupplier,
      error: findError,
    } = await supabase
      .from("suppliers")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (findError) {
      console.error("Find supplier error:", findError);

      return res.status(500).json({
        success: false,
        message: "Failed to find supplier",
        error: findError.message,
      });
    }

    if (!existingSupplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    // Prepare update
    const updateData = {};

    if (code !== undefined) {
      updateData.code = code.trim();
    }

    if (nameEnglish !== undefined) {
      updateData.nameEnglish = nameEnglish.trim();
    }

    if (nameUrdu !== undefined) {
      updateData.nameUrdu = nameUrdu.trim();
    }

    if (phone !== undefined) {
      updateData.phone = phone;
    }

    if (address !== undefined) {
      updateData.address = address;
    }

    if (openingBalance !== undefined) {
      updateData.openingBalance = Number(openingBalance);
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    // Check duplicate code if code changed
    if (
      updateData.code &&
      updateData.code !== existingSupplier.code
    ) {
      const {
        data: duplicateSupplier,
        error: duplicateError,
      } = await supabase
        .from("suppliers")
        .select("id")
        .eq("code", updateData.code)
        .neq("id", id)
        .maybeSingle();

      if (duplicateError) {
        console.error(
          "Duplicate supplier code error:",
          duplicateError
        );

        return res.status(500).json({
          success: false,
          message: "Failed to check supplier code",
          error: duplicateError.message,
        });
      }

      if (duplicateSupplier) {
        return res.status(400).json({
          success: false,
          message: "Supplier code already exists",
        });
      }
    }

    // Update
    const {
      data: updatedSupplier,
      error: updateError,
    } = await supabase
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

    if (updateError) {
      console.error("Update supplier error:", updateError);

      return res.status(500).json({
        success: false,
        message: "Failed to update supplier",
        error: updateError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Supplier updated successfully",

      data: {
        id: updatedSupplier.id,
        code: updatedSupplier.code,
        nameEnglish: updatedSupplier.nameEnglish,
        nameUrdu: updatedSupplier.nameUrdu,
        phone: updatedSupplier.phone || "",
        address: updatedSupplier.address || "",
        openingBalance: Number(
          updatedSupplier.openingBalance || 0
        ),
        status: updatedSupplier.status,
      },
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


// =========================================================
// DELETE SUPPLIER
// DELETE /api/suppliers/:id
// =========================================================

const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    // Check supplier
    const {
      data: supplier,
      error: findError,
    } = await supabase
      .from("suppliers")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (findError) {
      console.error("Find supplier error:", findError);

      return res.status(500).json({
        success: false,
        message: "Failed to find supplier",
        error: findError.message,
      });
    }

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    // Delete supplier
    const { error: deleteError } = await supabase
      .from("suppliers")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Delete supplier error:", deleteError);

      return res.status(500).json({
        success: false,
        message: "Failed to delete supplier",
        error: deleteError.message,
      });
    }

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


// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};