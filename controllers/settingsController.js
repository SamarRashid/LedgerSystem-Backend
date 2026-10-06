const { supabase } = require("../config/db");

// ==========================================
// GET PROFILE SETTINGS
// ==========================================
const getProfile = async (req, res) => {
  try {
    const { data: existingSettings, error: fetchError } =
      await supabase
        .from("settings")
        .select("*")
        .limit(1)
        .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    let settings = existingSettings;

    // ==========================================
    // CREATE DEFAULT SETTINGS
    // ==========================================
    if (!settings) {
      const { data: newSettings, error: createError } =
        await supabase
          .from("settings")
          .insert({
            name: "Admin",
            business_name: "Ledger System",
            phone: "",
            address: "",
            profile_image: "",
          })
          .select("*")
          .single();

      if (createError) {
        throw createError;
      }

      settings = newSettings;
    }

    // ==========================================
    // RESPONSE
    // ==========================================
    return res.status(200).json({
      id: settings.id,
      name: settings.name || "",
      businessName: settings.business_name || "",
      phone: settings.phone || "",
      address: settings.address || "",
      profileImage: settings.profile_image || "",
    });
  } catch (error) {
    console.error(
      "Get profile error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch profile settings",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE PROFILE SETTINGS
// ==========================================
const updateProfile = async (req, res) => {
  try {
    const {
      name,
      businessName,
      phone,
      address,
      profileImage,
    } = req.body;

    // ==========================================
    // FIND EXISTING SETTINGS
    // ==========================================
    const { data: existingSettings, error: fetchError } =
      await supabase
        .from("settings")
        .select("*")
        .limit(1)
        .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    let settings;

    // ==========================================
    // CREATE IF NOT EXISTS
    // ==========================================
    if (!existingSettings) {
      const { data: newSettings, error: createError } =
        await supabase
          .from("settings")
          .insert({
            name:
              name !== undefined
                ? name
                : "Admin",

            business_name:
              businessName !== undefined
                ? businessName
                : "Ledger System",

            phone:
              phone !== undefined
                ? phone
                : "",

            address:
              address !== undefined
                ? address
                : "",

            profile_image:
              profileImage !== undefined
                ? profileImage
                : "",
          })
          .select("*")
          .single();

      if (createError) {
        throw createError;
      }

      settings = newSettings;
    }

    // ==========================================
    // UPDATE EXISTING RECORD
    // ==========================================
    else {
      const updates = {};

      if (name !== undefined) {
        updates.name = name;
      }

      if (businessName !== undefined) {
        updates.business_name =
          businessName;
      }

      if (phone !== undefined) {
        updates.phone = phone;
      }

      if (address !== undefined) {
        updates.address = address;
      }

      if (profileImage !== undefined) {
        updates.profile_image =
          profileImage;
      }

      if (
        Object.keys(updates).length === 0
      ) {
        settings = existingSettings;
      } else {
        updates.updated_at =
          new Date().toISOString();

        const {
          data: updatedSettings,
          error: updateError,
        } = await supabase
          .from("settings")
          .update(updates)
          .eq(
            "id",
            existingSettings.id
          )
          .select("*")
          .single();

        if (updateError) {
          throw updateError;
        }

        settings = updatedSettings;
      }
    }

    // ==========================================
    // RESPONSE
    // ==========================================
    return res.status(200).json({
      message:
        "Profile settings updated successfully",

      settings: {
        id: settings.id,
        name: settings.name || "",
        businessName:
          settings.business_name || "",
        phone: settings.phone || "",
        address:
          settings.address || "",
        profileImage:
          settings.profile_image || "",
      },
    });
  } catch (error) {
    console.error(
      "Update profile error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to update profile settings",
      error: error.message,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};