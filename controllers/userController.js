const bcrypt = require("bcryptjs");
const { supabase } = require("../config/db");


// =========================================================
// GET ALL USERS
// =========================================================

const getUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, email, role, phone, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get users Supabase error:", error);

      return res.status(500).json({
        message: "Failed to fetch users",
        error: error.message,
      });
    }

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
      status: user.status || "Active",
      joined: user.created_at
        ? new Date(user.created_at).toLocaleDateString()
        : "Today",
    }));

    res.status(200).json(formattedUsers);

  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};


// =========================================================
// CREATE USER
// =========================================================

const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
    } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Name, email, password and role are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check existing user
    const {
      data: existingUser,
      error: existingUserError,
    } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingUserError) {
      console.error(
        "Check existing user error:",
        existingUserError
      );

      return res.status(500).json({
        message: "Failed to check existing user",
        error: existingUserError.message,
      });
    }

    if (existingUser) {
      return res.status(400).json({
        message: "A user with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const {
      data: user,
      error: createError,
    } = await supabase
      .from("users")
      .insert([
        {
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role,
          phone: phone || "",
          status: "Active",
        },
      ])
      .select(
        "id, name, email, role, phone, status, created_at"
      )
      .single();

    if (createError) {
      console.error(
        "Create user Supabase error:",
        createError
      );

      return res.status(500).json({
        message: "Failed to create user",
        error: createError.message,
      });
    }

    res.status(201).json({
      message: "User created successfully",

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        status: user.status,
        joined: user.created_at
          ? new Date(user.created_at).toLocaleDateString()
          : "Today",
      },
    });

  } catch (error) {
    console.error("Create user error:", error);

    res.status(500).json({
      message: "Failed to create user",
      error: error.message,
    });
  }
};


// =========================================================
// UPDATE USER
// =========================================================

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      password,
      role,
      phone,
      status,
    } = req.body;

    // Check user
    const {
      data: existingUser,
      error: findError,
    } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (findError) {
      console.error(
        "Find user error:",
        findError
      );

      return res.status(500).json({
        message: "Failed to find user",
        error: findError.message,
      });
    }

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Prepare update object
    const updateData = {};

    if (name) {
      updateData.name = name.trim();
    }

    if (email) {
      updateData.email = email.toLowerCase().trim();
    }

    if (role) {
      updateData.role = role;
    }

    if (phone !== undefined) {
      updateData.phone = phone;
    }

    if (status) {
      updateData.status = status;
    }

    // Update password only if provided
    if (password) {
      updateData.password = await bcrypt.hash(
        password,
        10
      );
    }

    // Check duplicate email
    if (
      updateData.email &&
      updateData.email !== existingUser.email
    ) {
      const {
        data: duplicateUser,
        error: duplicateError,
      } = await supabase
        .from("users")
        .select("id")
        .eq("email", updateData.email)
        .neq("id", id)
        .maybeSingle();

      if (duplicateError) {
        return res.status(500).json({
          message: "Failed to check email",
          error: duplicateError.message,
        });
      }

      if (duplicateUser) {
        return res.status(400).json({
          message: "A user with this email already exists",
        });
      }
    }

    // Update user
    const {
      data: updatedUser,
      error: updateError,
    } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select(
        "id, name, email, role, phone, status, created_at"
      )
      .single();

    if (updateError) {
      console.error(
        "Update user Supabase error:",
        updateError
      );

      return res.status(500).json({
        message: "Failed to update user",
        error: updateError.message,
      });
    }

    res.status(200).json({
      message: "User updated successfully",

      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone || "",
        status: updatedUser.status,
        joined: updatedUser.created_at
          ? new Date(
              updatedUser.created_at
            ).toLocaleDateString()
          : "Today",
      },
    });

  } catch (error) {
    console.error("Update user error:", error);

    res.status(500).json({
      message: "Failed to update user",
      error: error.message,
    });
  }
};


// =========================================================
// DELETE USER
// =========================================================

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check user
    const {
      data: existingUser,
      error: findError,
    } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (findError) {
      return res.status(500).json({
        message: "Failed to find user",
        error: findError.message,
      });
    }

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Delete
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error(
        "Delete user Supabase error:",
        deleteError
      );

      return res.status(500).json({
        message: "Failed to delete user",
        error: deleteError.message,
      });
    }

    res.status(200).json({
      message: "User deleted successfully",
    });

  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).json({
      message: "Failed to delete user",
      error: error.message,
    });
  }
};


// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};