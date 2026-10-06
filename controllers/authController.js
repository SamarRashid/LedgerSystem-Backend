const { supabase } = require("../config/db");
const bcrypt = require("bcryptjs");

// CHANGE PASSWORD
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, userId } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
    }

    // Find user in Supabase
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id, password")
      .eq("id", userId)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "Password is not configured for this user",
      });
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in Supabase
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("id", userId)
      .select("id")
      .maybeSingle();

    if (updateError) {
      throw updateError;
    }

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Password could not be updated",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

module.exports = {
  changePassword,
};