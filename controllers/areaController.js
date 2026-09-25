const Area = require("../models/Area");

// @desc    Get all areas
// @route   GET /api/areas
// @access  Public
const getAreas = async (req, res) => {
  try {
    const areas = await Area.find().sort({ createdAt: -1 });
    const formattedAreas = areas.map(a => ({
      id: a._id,
      code: a.code,
      postalCode: a.postalCode,
      nameEn: a.nameEn,
      nameUr: a.nameUr,
      city: a.city,
      route: a.route,
      status: a.status,
      description: a.description
    }));
    res.status(200).json({ success: true, data: formattedAreas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create an area
// @route   POST /api/areas
// @access  Public
const createArea = async (req, res) => {
  try {
    const { code, postalCode, nameEn, nameUr, city, route, status, description } = req.body;
    
    // Check if code exists
    const areaExists = await Area.findOne({ code });
    if (areaExists) {
      return res.status(400).json({ success: false, message: "Area code already exists" });
    }

    const a = await Area.create({
      code,
      postalCode,
      nameEn,
      nameUr,
      city,
      route,
      status,
      description
    });

    const area = {
      id: a._id,
      code: a.code,
      postalCode: a.postalCode,
      nameEn: a.nameEn,
      nameUr: a.nameUr,
      city: a.city,
      route: a.route,
      status: a.status,
      description: a.description
    };

    res.status(201).json({ success: true, data: area });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an area
// @route   PUT /api/areas/:id
// @access  Public
const updateArea = async (req, res) => {
  try {
    const area = await Area.findById(req.params.id);
    
    if (!area) {
      return res.status(404).json({ success: false, message: "Area not found" });
    }

    const a = await Area.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    const updatedArea = {
      id: a._id,
      code: a.code,
      postalCode: a.postalCode,
      nameEn: a.nameEn,
      nameUr: a.nameUr,
      city: a.city,
      route: a.route,
      status: a.status,
      description: a.description
    };

    res.status(200).json({ success: true, data: updatedArea });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an area
// @route   DELETE /api/areas/:id
// @access  Public
const deleteArea = async (req, res) => {
  try {
    const area = await Area.findById(req.params.id);

    if (!area) {
      return res.status(404).json({ success: false, message: "Area not found" });
    }

    await area.deleteOne();
    res.status(200).json({ success: true, message: "Area removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAreas,
  createArea,
  updateArea,
  deleteArea
};
