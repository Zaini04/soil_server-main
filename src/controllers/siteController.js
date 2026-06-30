
const AppError = require("../utils/appError");
const { sendSuccessResponse } = require("../utils/helpers");  
const catchAsync = require('../utils/catchAsync');
const logger = require("../logger")("Site_CONTROLLER");
const handlerFactory = require('./factories/handlerFactory');
const { POSTJoiSiteSchema, PATCHJoiSiteSchema, siteValidation, GETJoiSiteSchema } = require("../validations/siteValidations");
const Site = require("../models/siteModel");

const sitesRecordColumns = [
  { header: "Date",     key: "date",         width: 65,  getValue: (r) => new Date(r.createdAt).toLocaleDateString("en-GB") },
  { header: "Client",    key: "client",      width: 50,  getValue: (r) => r.client?.name || "" },
  { header: "Site",  key: "siteName",      width: 60,  getValue: (r) => r.siteName || "", wrap: true },
  { header: "Address",  key: "address",      width: 60,  getValue: (r) => r.address || "", wrap: true },
  { header: "Status",  key: "status",      width: 60,  getValue: (r) => r.status || "", wrap: true },

];
 
const sitesTotals = [

];
 
const sitesRecordPopulate = [
  { path: "client", select: "name" },
];


exports.exportSitesRecordsExcel = handlerFactory.exportExcel(Site, {
  buildQuery: (req) => ({}),
  dateField: "date",
  populate: sitesRecordPopulate,
  columns: sitesRecordColumns,
  totalsConfig: sitesTotals,
  sheetName: "Sites Records",
});
 
exports.exportSitesRecordsPdf = handlerFactory.exportPdf(Site, {
  buildQuery: (req) => ({}),
  dateField: "date",
  populate: sitesRecordPopulate,
  columns: sitesRecordColumns,
  totalsConfig: sitesTotals,
  title:  "Sites Records",
});


exports.addSite = catchAsync(async (req, res, next) => {
  const { value: validData, error } = POSTJoiSiteSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

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
  const populateOptions = [
    { path: "client", select: "name" },
    { path: "createdBy", select: "username" },
    
  ];

  handlerFactory.getAll(Site, populateOptions, logger, query)(req, res, next);
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


exports.getSitesWithMaterialByClient = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;

    const sites = await Site.find({ 
      client: id, 
      status: "Active" 
    }).select("siteName  materialsRates "); 

    if (!sites || sites.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active sites found for this client.",
      });
    }

    sendSuccessResponse(res,200,logger,{
      message:"clients sites data",
      docs:sites
    })
  } catch (error) {

    return next(new AppError(error.message, 500));

  }
})


exports.getSitesByClient = catchAsync(async (req, res, next) => {

  const populateOptions = [
    { path: "client", select: "name image" },
  ];

  handlerFactory.getAllByField(Site,"client",populateOptions,logger)(req, res, next)
});


exports.getSitesDropdownList = async (req, res, next) => {
  try {
    const sites = await Site.find({ status: "Active" }) 
      .select("_id siteName")
      .lean();

  
     sendSuccessResponse(res,200,logger,{
      message:"clients dropdown list",
      docs:sites
    })
    
  } catch (error) {
        return next(new AppError(error.message, 500));
  }
};
