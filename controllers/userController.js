const bcrypt = require("bcryptjs");
const { supabase } = require("../config/db");

// Helper: Format user response (password kabhi return nahi hoga)
const formatUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || "",
  status: user.status || "Active",
  joined: user.created_at
    ? new Date(user.created_at).toLocaleDateString()
    : "Today",
});

// GET ALL USERS
// GET /api/users
const getUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, email, role, phone, status, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json((users || []).map(formatUser));
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// CREATE USER
// POST /api/users
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password ||
      typeof role !== "string" ||
      !role.trim()
    ) {
      return res.status(400).json({
        message: "Name, email, password and role are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingUser) {
      return res.status(409).json({
        message: "A user with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: user, error: createError } = await supabase
      .from("users")
      .insert({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: role.trim(),
        phone: phone || "",
        status: "Active",
      })
      .select("id, name, email, role, phone, status, created_at")
      .single();

    if (createError) throw createError;

    return res.status(201).json({
      message: "User created successfully",
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Create user error:", error);

    return res.status(500).json({
      message: "Failed to create user",
      error: error.message,
    });
  }
};

// UPDATE USER
// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, phone, status } = req.body;

    const { data: existingUser, error: findError } = await supabase
      .from("users")
      .select("id, email")
      .eq("id", id)
      .maybeSingle();

    if (findError) throw findError;

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          message: "Name cannot be empty",
        });
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      if (typeof email !== "string" || !email.trim()) {
        return res.status(400).json({
          message: "A valid email is required",
        });
      }
      updateData.email = email.trim().toLowerCase();
    }

    if (role !== undefined) {
      if (typeof role !== "string" || !role.trim()) {
        return res.status(400).json({
          message: "Role cannot be empty",
        });
      }
      updateData.role = role.trim();
    }

    if (phone !== undefined) {
      updateData.phone = phone || "";
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (password !== undefined && password !== "") {
      if (typeof password !== "string" || password.length < 8) {
        return res.status(400).json({
          message: "Password must be at least 8 characters long",
        });
      }

      updateData.password = await bcrypt.hash(password, 10);
    }

    // Check duplicate email if changed
    if (
      updateData.email &&
      updateData.email !== existingUser.email
    ) {
      const { data: duplicateUser, error: duplicateError } =
        await supabase
          .from("users")
          .select("id")
          .eq("email", updateData.email)
          .neq("id", id)
          .maybeSingle();

      if (duplicateError) throw duplicateError;

      if (duplicateUser) {
        return res.status(409).json({
          message: "A user with this email already exists",
        });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided for update",
      });
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select("id, name, email, role, phone, status, created_at")
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      message: "User updated successfully",
      user: formatUser(updatedUser),
    });
  } catch (error) {
    console.error("Update user error:", error);

    return res.status(500).json({
      message: "Failed to update user",
      error: error.message,
    });
  }
};

// DELETE USER
// DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existingUser, error: findError } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (findError) throw findError;

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    return res.status(500).json({
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};