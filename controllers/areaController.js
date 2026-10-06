
const { supabase } = require("../config/db");

// Format database row for the frontend
const formatArea = (a) => ({
  id: a.id,
  code: a.code,
  postalCode: a.postalCode ?? "",
  nameEn: a.nameEn ?? "",
  nameUr: a.nameUr ?? "",
  city: a.city ?? "",
  route: a.route ?? "",
  status: a.status ?? "Active",
  description: a.description ?? "",
});

// GET /api/areas
const getAreas = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("areas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: (data || []).map(formatArea),
    });
  } catch (error) {
    console.error("Get areas error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// POST /api/areas
const createArea = async (req, res) => {
  try {
    const {
      code,
      postalCode,
      nameEn,
      nameUr,
      city,
      route,
      status,
      description,
    } = req.body;

    if (!code || !nameEn || !nameUr) {
      return res.status(400).json({
        success: false,
        message: "Code, English name and Urdu name are required",
      });
    }

    const { data: existingArea, error: checkError } = await supabase
      .from("areas")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingArea) {
      return res.status(409).json({
        success: false,
        message: "Area code already exists",
      });
    }

    const { data, error } = await supabase
      .from("areas")
      .insert({
        code,
        postalCode: postalCode || null,
        nameEn,
        nameUr,
        city: city || null,
        route: route || null,
        status: status || "Active",
        description: description || null,
      })
      .select("*")
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      data: formatArea(data),
    });
  } catch (error) {
    console.error("Create area error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// PUT /api/areas/:id
const updateArea = async (req, res) => {
  try {
    const allowedFields = [
      "code",
      "postalCode",
      "nameEn",
      "nameUr",
      "city",
      "route",
      "status",
      "description",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    if (updates.code) {
      const { data: duplicate, error: duplicateError } = await supabase
        .from("areas")
        .select("id")
        .eq("code", updates.code)
        .neq("id", req.params.id)
        .maybeSingle();

      if (duplicateError) throw duplicateError;

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Area code already exists",
        });
      }
    }

    const { data, error } = await supabase
      .from("areas")
      .update(updates)
      .eq("id", req.params.id)
      .select("*")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Area not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: formatArea(data),
    });
  } catch (error) {
    console.error("Update area error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE /api/areas/:id
const deleteArea = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("areas")
      .delete()
      .eq("id", req.params.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Area not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Area removed successfully",
    });
  } catch (error) {
    console.error("Delete area error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAreas,
  createArea,
  updateArea,
  deleteArea,
};