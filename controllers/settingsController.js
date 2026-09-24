const Settings = require("../models/Settings");

// GET PROFILE SETTINGS
const getProfile = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({
        name: "Admin",
        businessName: "Ledger System",
        phone: "",
        address: "",
      });
    }

    res.status(200).json({
      id: settings._id.toString(),
      name: settings.name,
      businessName: settings.businessName,
      phone: settings.phone,
      address: settings.address,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      message: "Failed to fetch profile settings",
      error: error.message,
    });
  }
};

// UPDATE PROFILE SETTINGS
const updateProfile = async (req, res) => {
  try {
    const {
      name,
      businessName,
      phone,
      address,
    } = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings();
    }

    if (name !== undefined) settings.name = name;
    if (businessName !== undefined) {
      settings.businessName = businessName;
    }
    if (phone !== undefined) settings.phone = phone;
    if (address !== undefined) settings.address = address;

    await settings.save();

    res.status(200).json({
      message: "Profile settings updated successfully",

      settings: {
        id: settings._id.toString(),
        name: settings.name,
        businessName: settings.businessName,
        phone: settings.phone,
        address: settings.address,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      message: "Failed to update profile settings",
      error: error.message,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};