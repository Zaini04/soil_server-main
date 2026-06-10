
const AppError = require("../utils/appError");
const { sendSuccessResponse } = require("../utils/helpers");  
const catchAsync = require('../utils/catchAsync');
const logger = require("../logger")("Site_CONTROLLER");
const handlerFactory = require('./factories/handlerFactory');
const { POSTJoiSiteSchema, PATCHJoiSiteSchema, siteValidation, GETJoiSiteSchema } = require("../validations/siteValidations");
const Site = require("../models/siteModel");
// Create a new location site profile
exports.addSite = catchAsync(async (req, res, next) => {
  // Validate parent properties and child materials array layout
  const { value: validData, error } = POSTJoiSiteSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  // Optional: Prevent duplicate site registration names under the exact same client footprint
  const siteExists = await Site.findOne({ 
    siteName: validData.siteName, 
    client: validData.client 
  });
  if (siteExists) {
    return next(new AppError("A site profile with this name is already registered for this client.", 400));
  }

  req.body = validData;
  handlerFactory.createOne(Site,siteValidation, logger)(req, res, next);
});

// Get all sites (Supports .populate() setups inside your custom handlerFactory)
exports.getAllSites = catchAsync(async (req, res, next) => {
  const { value: validQuery, error } = GETJoiSiteSchema.validate(req.query);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  req.query = validQuery;

  const query = {}
  handlerFactory.getAll(Site,   { path: "client", select: "name" }, logger, query)(req, res, next);
});
// Get single location site data by database ID
exports.getSite = handlerFactory.getOne(Site, logger);

// Update site configurations dynamically
exports.updateSite = catchAsync(async (req, res, next) => {
  const { value: validData, error } = PATCHJoiSiteSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  // Block namespace conflicts during updates
  if (validData.siteName && validData.client) {
    const duplicateSite = await Site.findOne({
      siteName: validData.siteName,
      client: validData.client,
      _id: { $ne: req.params.id }
    });
    if (duplicateSite) {
      return next(new AppError("Another location site uses this profile name under the designated client profile.", 400));
    }
  }

  req.body = validData;
  handlerFactory.updateOne(Site, logger)(req, res, next);
});

// Remove site entry record completely
exports.deleteSite = handlerFactory.deleteOne(Site, logger);

exports.getSiteMaterials = catchAsync(async (req, res, next) => {
  const { clientId, siteId } = req.params;

  const site = await Site.findOne({
    _id: siteId,
    client: clientId,
  }).select("siteName materialsRates");

  if (!site) {
    return next(
      new AppError(
        "Site not found against the selected client.",
        404
      )
    );
  }

  sendSuccessResponse(
    res,
    200,
    {
      siteId: site._id,
      siteName: site.siteName,
      materials: site.materialsRates,
    },
    "Site materials fetched successfully."
  );
});