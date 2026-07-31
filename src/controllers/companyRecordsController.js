const CompanyRecords = require("../models/companyRecordsModel");
const Site = require("../models/siteModel");
const APIFeatures = require("../utils/APIFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { sendSuccessResponse } = require("../utils/helpers");
const { POSTJoiCompanyRecordsSchema, GETJoiCompanyRecordsSchema, PATCHJoiCompanyRecordsSchema } = require("../validations/companyRecordsValidation");
const logger = require("../logger")("CompanyRecords_CONTROLLER");
const handlerFactory = require('./factories/handlerFactory');
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const path = require("path");
const LOGO_PATH = path.join(__dirname, "../assets/headers.png");

exports.enterComanyRecords = catchAsync(async (req, res, next) => {

  const { value: validData, error } = POSTJoiCompanyRecordsSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  const {biltyNo} = req.body
  const biltyNoExists= await CompanyRecords.findOne({biltyNo:biltyNo})
  
  if(biltyNoExists){
      return next(new AppError("Bilty number already exists.", 404));
  }
  const entry = await CompanyRecords.create({...validData,createdBy:req.user._id});

  sendSuccessResponse(res, 201, logger, {
    message: " Company record created successfully.",
    doc: entry,
  });
});

exports.getCompanyRecordsByClient = catchAsync(async (req, res, next) => {
 const { value: validQuery, error } = GETJoiCompanyRecordsSchema.validate(req.query);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  req.query = validQuery;

    const populateOptions = [
    { path: "client", select: "name phoneNumber image" },
    { path: "site", select: "siteName" },
    { path: "vehicle", select: "vehicleNo  typeVehicle" },
    { path: "createdBy", select: "username" },
  ];

  handlerFactory.getAllByField(CompanyRecords,"client",populateOptions,logger,"date")(req, res, next)

});

exports.getAllCompanyExpenses = catchAsync(async (req, res, next) => {
    const { value: validQuery, error } = GETJoiCompanyRecordsSchema.validate(req.query);
    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }
    req.query = validQuery;

    if (!req.query.from && !req.query.to) {
        const now = new Date();
        req.query.from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
        req.query.to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)).toISOString();
    }

    const query = {};
    const populateOptions = [
        { path: "createdBy", select: "username" },
        { path: "client", select: "name phoneNumber image" },
        {path:"site",select:"siteName "},
            { path: "vehicle", select: "vehicleNo  typeVehicle" },

        
    ];

    handlerFactory.getAll(CompanyRecords, populateOptions, logger, query, "date")(req, res, next);
});

exports.getCompanyExpenseSummary = catchAsync(async (req, res, next) => {
  const { client, site, from, to } = req.query;

  if (!client) {
    return next(new AppError("Client id is required.", 400));
  }

  let startDate, endDate;
  if (from && to) {
    startDate = new Date(from);
    startDate.setUTCHours(0, 0, 0, 0);
    endDate = new Date(to);
    endDate.setUTCHours(23, 59, 59, 999);
  } else {
    const now = new Date();
    startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  }

  const Client = require("../models/clientModel");
  const Site = require("../models/siteModel");

  const clientDoc = await Client.findById(client).select("name phoneNumber");
  if (!clientDoc) {
    return next(new AppError("Client not found.", 404));
  }

  let siteDoc = null;
  if (site) {
    // Ensure the site belongs to this client
    siteDoc = await Site.findOne({ _id: site, client: clientDoc._id }).select("siteName address");
    if (!siteDoc) {
      return next(new AppError("Site not found for this client.", 404));
    }
  }

  const matchStage = {
    client: clientDoc._id,
    date: { $gte: startDate, $lte: endDate },
  };

  if (siteDoc) {
    matchStage.site = siteDoc._id;
  }

  const agg = await CompanyRecords.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: "$totalRate" },
        totalSft: { $sum: "$totalSft" },
      },
    },
  ]);

  const totalSpent = agg[0]?.totalSpent || 0;
  const totalSft = agg[0]?.totalSft || 0;

  sendSuccessResponse(res, 200, logger, {
    client: {
      _id: clientDoc._id,
      name: clientDoc.name,
      phoneNumber: clientDoc.phoneNumber,
    },
    site: siteDoc
      ? {
          _id: siteDoc._id,
          siteName: siteDoc.siteName,
          address: siteDoc.address,
        }
      : null,
    totalSpent,
    totalSft,
    period: { from: startDate, to: endDate },
  });
});


const getExportPeriod = (req) => {
  const { from, to } = req.query;
  if (from && to) {
    const startDate = new Date(from);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(to);
    endDate.setUTCHours(23, 59, 59, 999);
    return { startDate, endDate };
  }
  const now = new Date();
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { startDate, endDate };
};

const fetchAllClientsSummary = async (req) => {
  const { startDate, endDate } = getExportPeriod(req);
  const Client = require("../models/clientModel");

  const agg = await CompanyRecords.aggregate([
    { $match: { date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: "$client", totalExpense: { $sum: "$totalRate" }, totalSft: { $sum: "$totalSft" } } },
  ]);

  const expenseMap = {};
  agg.forEach((e) => (expenseMap[e._id.toString()] = { totalExpense: e.totalExpense, totalSft: e.totalSft }));

  const clients = await Client.find({ status: "Active" })
    .select("name phoneNumber")
    .lean();

  return clients.map((c) => {
    const stats = expenseMap[c._id.toString()] || { totalExpense: 0, totalSft: 0 };
    return {
      ...c,
      totalExpense: stats.totalExpense,
      totalSft: stats.totalSft,
    };
  });
};

const clientSummaryColumns = [
  { header: "Client", key: "name", width: 60, getValue: (r) => r.name || "" },
  { header: "Phone", key: "phoneNumber", width: 50, getValue: (r) => r.phoneNumber || "" },
  { header: "Total Sft", key: "totalSft", width: 50, getValue: (r) => r.totalSft ?? 0 },
  { header: "Total Amount", key: "totalExpense", width: 50, getValue: (r) => r.totalExpense ?? 0 },
];

const clientSummaryTotals = (records) => ({
  totalSft: records.reduce((sum, r) => sum + (r.totalSft || 0), 0),
  totalExpense: records.reduce((sum, r) => sum + (r.totalExpense || 0), 0),
});

const clientSummaryTotalsConfig = [
  { label: "TOTAL Sft", field: "totalSft" },
  { label: "TOTAL Amount", field: "totalExpense", prefix: "Rs. " },
];

const fetchSingleClientRecords = async (req) => {
  const { startDate, endDate } = getExportPeriod(req);
  const {client,site} = req.query

  const filter ={
    client,
    date: { $gte: startDate, $lte: endDate },
  }

  if(site){
    filter.site = site
  }

  return CompanyRecords.find(filter)
    .populate([
      { path: "createdBy", select: "username" },
      { path: "client", select: "name phoneNumber" },
      { path: "site", select: "siteName" },
      { path: "vehicle", select: "vehicleNo typeVehicle" },
    ])
    .sort({ date: -1 });
};

const companyExpenseDetailColumns = [
  { header: "Date", key: "date", width: 55, getValue: (r) => new Date(r.date).toLocaleDateString("en-GB") },
  { header: "Client", key: "client", width: 45, getValue: (r) => r.client?.name || "" },
  { header: "Client No", key: "phoneNumber", width: 80, getValue: (r) => r.client?.phoneNumber || "" },
  { header: "Bilty No", key: "biltyNo", width: 45, getValue: (r) => r.biltyNo || "" },
  { header: "Site", key: "site", width: 55, getValue: (r) => r.site?.siteName || "" },
  { header: "Vehicle", key: "vehicle", width: 50, getValue: (r) => r.vehicle?.vehicleNo || "" },
  { header: "Material", key: "materialType", width: 50, getValue: (r) => r.materialType || "" },
  { header: "Rate", key: "rate", width: 40, getValue: (r) => r.rate ?? 0 },
  { header: "Total Sft", key: "totalSft", width: 45, getValue: (r) => r.totalSft ?? 0 },
  { header: "Amount", key: "totalRate", width: 50, getValue: (r) => r.totalRate ?? 0 },
];

const companyExpenseDetailTotals = (records) => ({
  totalSft: records.reduce((sum, r) => sum + (r.totalSft || 0), 0),
  totalExpense: records.reduce((sum, r) => sum + (r.totalRate || 0), 0),
});

const companyExpenseDetailTotalsConfig = [
  { label: "TOTAL Sft", field: "totalSft" },
  { label: "TOTAL Amount", field: "totalExpense", prefix: "Rs. " },
];

const fetchSelectedCompanyRecords = async (req) => {
  const { ids = [] } = req.body || {};

  return CompanyRecords.find({ _id: { $in: ids } })
    .populate([
      { path: "createdBy", select: "username" },
      { path: "client", select: "name phoneNumber" },
      { path: "site", select: "siteName" },
      { path: "vehicle", select: "vehicleNo typeVehicle" },
    ])
    .sort({ date: -1 });
};

const selectedCompanyRecordsTotals = (records) => ({
  totalSft: records.reduce((sum, r) => sum + (r.totalSft || 0), 0),
  totalExpense: records.reduce((sum, r) => sum + (r.totalRate || 0), 0),
});

const selectedCompanyRecordsTotalsConfig = [
  { label: "TOTAL Sft", field: "totalSft" },
  { label: "TOTAL Amount", field: "totalExpense", prefix: "Rs. " },
];

exports.exportCompanyExpenseExcel = catchAsync(async (req, res, next) => {
  const hasSelectedIds = Array.isArray(req.body?.ids) && req.body.ids.length > 0;
  const isSingleClient = !hasSelectedIds && !!req.query.client;

  if (hasSelectedIds) {

    return handlerFactory.exportExcel(CompanyRecords, {
      fetchRecords: fetchSelectedCompanyRecords,
      getTotals: selectedCompanyRecordsTotals,
      columns: companyExpenseDetailColumns,
      totalsConfig: selectedCompanyRecordsTotalsConfig,
      sheetName: `Company Records`,
    })(req, res, next);
  }

  if (isSingleClient) {
    const Client = require("../models/clientModel");
    const clientDoc = await Client.findById(req.query.client).select("name");
    const clientName = clientDoc?.name || "Client";
    return handlerFactory.exportExcel(CompanyRecords, {
      fetchRecords: fetchSingleClientRecords,
      getTotals: companyExpenseDetailTotals,
      columns: companyExpenseDetailColumns,
      totalsConfig: companyExpenseDetailTotalsConfig,
      sheetName: `${clientName} - Company Records`,
    })(req, res, next);
  }

  return handlerFactory.exportExcel(CompanyRecords, {
    fetchRecords: fetchAllClientsSummary,
    getTotals: clientSummaryTotals,
    columns: clientSummaryColumns,
    totalsConfig: clientSummaryTotalsConfig,
    sheetName: "All Clients Expense Summary",
  })(req, res, next);
});

exports.exportCompanyExpensePdf = catchAsync(async (req, res, next) => {
  const hasSelectedIds = Array.isArray(req.body?.ids) && req.body.ids.length > 0;
  const isSingleClient = !hasSelectedIds && !!req.query.client;

  if (hasSelectedIds) {
    return handlerFactory.exportPdf(CompanyRecords, {
      fetchRecords: fetchSelectedCompanyRecords,
      getTotals: selectedCompanyRecordsTotals,
      columns: companyExpenseDetailColumns,
      totalsConfig: selectedCompanyRecordsTotalsConfig,
      title: "Company Records",
    })(req, res, next);
  }

  if (isSingleClient) {
    const Client = require("../models/clientModel");
    const clientDoc = await Client.findById(req.query.client).select("name");
    const clientName = clientDoc?.name || "Client";
    return handlerFactory.exportPdf(CompanyRecords, {
      fetchRecords: fetchSingleClientRecords,
      getTotals: companyExpenseDetailTotals,
      columns: companyExpenseDetailColumns,
      totalsConfig: companyExpenseDetailTotalsConfig,
      title: `${clientName} - Company Records`,
      toLabel:clientName
    })(req, res, next);
  }

  return handlerFactory.exportPdf(CompanyRecords, {
    fetchRecords: fetchAllClientsSummary,
    getTotals: clientSummaryTotals,
    columns: clientSummaryColumns,
    totalsConfig: clientSummaryTotalsConfig,
    title: "All Clients Expense Summary",
  })(req, res, next);
});

// exports.updateCompanyRecord = catchAsync(async(req,res, next)=>{

//     const { value: validData, error } = POSTJoiCompanyRecordsSchema.validate(req.body);
//   if (error) {
//     return next(new AppError(error.details[0].message, 400));
//   }

//   req.body = validData;
//   handlerFactory.updateOne(CompanyRecords, logger)(req, res, next);

// })


exports.updateCompanyRecord = catchAsync(async (req, res, next) => {
  const { value: validData, error } = PATCHJoiCompanyRecordsSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  if (validData.biltyNo) {
    const duplicateRecord = await CompanyRecords.findOne({
      biltyNo: validData.biltyNo,
      _id: { $ne: req.params.id },
    });
    if (duplicateRecord) {
      return next(new AppError("This Bilty number is already assigned to another record.", 400));
    }
  }

  req.body = validData;
  handlerFactory.updateOne(CompanyRecords, logger)(req, res, next);
});
exports.deleteCompanyRecord = handlerFactory.removeFromDb(CompanyRecords, logger);





exports.exportCompanyRecordsExcel = catchAsync(async (req, res) => {
  const clientId = req.params.id;
  const { ids = [] } = req.body;

  let query = {
    client: clientId,
  };

  if (ids.length > 0) {
    query._id = { $in: ids };
  }

  if (req.query.site) {
    const sites = await Site.find({
      siteName: {
        $regex: req.query.site,
        $options: "i",
      },
    }).select("_id");

    query.site = { $in: sites.map((s) => s._id) };

    delete req.query.site;
  }

  const features = new APIFeatures(
    CompanyRecords.find(query),
    req.query,
    "date"
  ).filter();

  const records = await features.query
    .populate("client", "name")
    .populate("site", "siteName")
    .populate("vehicle", "vehicleNo")
    .sort({ date: -1 });

  const totals = records.reduce(
    (acc, item) => {
      acc.totalSft += item.totalSft || 0;
      acc.totalRate += item.totalRate || 0;

      return acc;
    },
    {
      totalSft: 0,
      totalRate: 0,
    }
  );

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Company Records");

  worksheet.columns = [
    { header: "Date", key: "date", width: 18 },
    { header: "Bilty No", key: "biltyNo", width: 20 },
    { header: "Site", key: "site", width: 25 },
    { header: "Vehicle", key: "vehicle", width: 20 },
    { header: "Material Type", key: "materialType", width: 20 },
    { header: "Rate", key: "rate", width: 15 },
    { header: "Total Sft", key: "totalSft", width: 15 },
    { header: "Total Rate", key: "totalRate", width: 18 },
  ];

  worksheet.getRow(1).font = { bold: true };

  records.forEach((record) => {
    worksheet.addRow({
      date: record.date?.toLocaleDateString("en-GB"),
      biltyNo: record.biltyNo,
      site: record.site?.siteName,
      vehicle: record.vehicle?.vehicleNo,
      materialType: record.materialType,
      rate: record.rate,
      totalSft: record.totalSft,
      totalRate: record.totalRate,
    });
  });

  worksheet.addRow([]);

  const totalRow = worksheet.addRow({
    site: "TOTAL",
    totalSft: totals.totalSft,
    totalRate: totals.totalRate,
  });

  totalRow.font = { bold: true };

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename=company-records-${Date.now()}.xlsx`
  );

  await workbook.xlsx.write(res);
  res.end();
});




exports.exportCompanyRecordsPdf = catchAsync(async (req, res) => {
  const clientId = req.params.id;
  const { ids = [] } = req.body;

  let query = { client: clientId };
  if (ids.length > 0) query._id = { $in: ids };

  if (req.query.site) {
    const sites = await Site.find({
      siteName: { $regex: req.query.site, $options: "i" },
    }).select("_id");

    query.site = { $in: sites.map((s) => s._id) };

    delete req.query.site;
  }

  const features = new APIFeatures(
    CompanyRecords.find(query),
    req.query,
    "date"
  ).filter();

  const records = await features.query
    .populate("client", "name")
    .populate("site", "siteName")
    .populate("vehicle", "vehicleNo")
    .sort({ date: -1 });

  if (!records.length) {
    return res.status(404).json({ success: false, message: "No records found" });
  }

  const totals = records.reduce(
    (acc, item) => {
      acc.totalSft += item.totalSft || 0;
      acc.totalRate += item.totalRate || 0;
      return acc;
    },
    { totalSft: 0, totalRate: 0 }
  );

  const clientName = records[0]?.client?.name || "N/A";

  const doc = new PDFDocument({ margin: 30, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=company-records-${Date.now()}.pdf`
  );
  doc.pipe(res);

  const pageLeft = 25;
  const pageRight = doc.page.width - 25;
  const tableWidth = pageRight - pageLeft; // 555

  const cols = {
    sr:       { x: pageLeft,       w: 30  },
    date:     { x: pageLeft + 20,  w: 70  },
    bilty:    { x: pageLeft + 90,  w: 60  },
    site:     { x: pageLeft + 150, w: 80  },
    vehicle:  { x: pageLeft + 245, w: 70  },
    material: { x: pageLeft + 315, w: 80  },
    rate:     { x: pageLeft + 395, w: 55  },
    sft:      { x: pageLeft + 450, w: 55  },
    total:    { x: pageLeft + 505, w: 70  },
  };

  const PADDING = { top: 5, bottom: 5, left: 4 };
  const HEADER_HEIGHT = 28;
  const MIN_ROW_HEIGHT = 22;
  const FONT_SIZE = 8;

  const drawTableHeader = (y) => {
    doc.rect(pageLeft, y, tableWidth, HEADER_HEIGHT).fill("#e8e8e8");

    doc.font("Helvetica-Bold").fontSize(FONT_SIZE).fillColor("#000000");

    const headers = [
      { key: "sr",       label: "Sr#"      },
      { key: "date",     label: "Date"     },
      { key: "bilty",    label: "Bilty"    },
      { key: "site",     label: "Site"     },
      { key: "vehicle",  label: "Vehicle"  },
      { key: "material", label: "Material" },
      { key: "rate",     label: "Rate"     },
      { key: "sft",      label: "SFT"      },
      { key: "total",    label: "Amount"   },
    ];

    headers.forEach(({ key, label }) => {
      const col = cols[key];
      doc.text(label, col.x + PADDING.left, y + PADDING.top + 4, {
        width: col.w - PADDING.left * 2,
        lineBreak: false,
      });
    });

    doc.strokeColor("#000000").lineWidth(1);
    Object.values(cols).slice(1).forEach(({ x }) => {
      doc.moveTo(x, y).lineTo(x, y + HEADER_HEIGHT).stroke();
    });

    doc.rect(pageLeft, y, tableWidth, HEADER_HEIGHT).stroke();

    return y + HEADER_HEIGHT;
  };

  const getRowHeight = (record) => {
    doc.font("Helvetica").fontSize(FONT_SIZE);

    const wrappingCols = [
      { text: record.site?.siteName || "",     width: cols.site.w     - PADDING.left * 2 },
      { text: record.vehicle?.vehicleNo || "", width: cols.vehicle.w  - PADDING.left * 2 },
      { text: record.materialType || "",       width: cols.material.w - PADDING.left * 2 },
    ];

    let maxHeight = MIN_ROW_HEIGHT;
    wrappingCols.forEach(({ text, width }) => {
      const h = doc.heightOfString(text, { width }) + PADDING.top + PADDING.bottom;
      if (h > maxHeight) maxHeight = h;
    });

    return Math.max(maxHeight, MIN_ROW_HEIGHT);
  };

  const drawRow = (record, index, y, rowHeight) => {
    const bg = index % 2 === 0 ? "#f9f9f9" : "#ffffff";
    doc.rect(pageLeft, y, tableWidth, rowHeight).fill(bg);

    doc.font("Helvetica").fontSize(FONT_SIZE).fillColor("#000000");

    const textY = y + PADDING.top;

    doc.text(String(index + 1), cols.sr.x + PADDING.left, textY, {
      width: cols.sr.w ,
      lineBreak: false,
    });

    doc.text(
      new Date(record.date).toLocaleDateString("en-GB"),
      cols.date.x + PADDING.left,
      textY,
      { width: cols.date.w , lineBreak: false }
    );

    doc.text(record.biltyNo || "", cols.bilty.x + PADDING.left, textY, {
      width: cols.bilty.w ,
      lineBreak: false,
    });

    doc.text(record.site?.siteName || "", cols.site.x + PADDING.left, textY, {
      width: cols.site.w ,
    });

    doc.text(record.vehicle?.vehicleNo || "", cols.vehicle.x + PADDING.left, textY, {
      width: cols.vehicle.w,
    });

    doc.text(record.materialType || "", cols.material.x + PADDING.left, textY, {
      width: cols.material.w ,
    });

    doc.text(
      record.rate?.toLocaleString() || "0",
      cols.rate.x + PADDING.left,
      textY,
      { width: cols.rate.w, lineBreak: false }
    );

    doc.text(
      record.totalSft?.toLocaleString() || "0",
      cols.sft.x + PADDING.left,
      textY,
      { width: cols.sft.w, lineBreak: false }
    );

    doc.text(
      record.totalRate?.toLocaleString() || "0",
      cols.total.x + PADDING.left,
      textY,
      { width: cols.total.w , lineBreak: false }
    );

    doc.strokeColor("#000000").lineWidth(0.8);
    Object.values(cols).slice(1).forEach(({ x }) => {
      doc.moveTo(x, y).lineTo(x, y + rowHeight).stroke();
    });

    doc.rect(pageLeft, y, tableWidth, rowHeight).stroke();
  };

      const PAGE_LEFT   = 30;
          const PAGE_RIGHT  = doc.page.width - 30;





  const headerY = 30;
      const headerH    = 60;

          const TABLE_WIDTH = PAGE_RIGHT - PAGE_LEFT;



  let headerHeight = 60;

  try {
    const imgDims = doc.openImage(LOGO_PATH);
    headerHeight = tableWidth * (imgDims.height / imgDims.width);

    doc.image(LOGO_PATH, pageLeft, headerY, {
      width: tableWidth,
      height: headerHeight,
    });
  } catch (e) {
    console.error("Logo image failed to load:", e.message);
    headerHeight = 60;
    doc.rect(pageLeft, headerY, tableWidth, headerHeight).fill("#000000");
    const titleTextHeight = doc.heightOfString(clientName, { width: tableWidth });
    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(20)
      .text(clientName, pageLeft, headerY + (headerHeight - titleTextHeight) / 2, {
        width: tableWidth,
        align: "center",
      });
  }

 doc
  .fillColor("#000000")
  .font("Helvetica-Bold")
  .fontSize(13)
  .text(
    clientName ? `To: ${clientName}` : "",
    PAGE_LEFT,
    headerY + headerHeight + 1,
    { width: TABLE_WIDTH / 2, align: "left" }
  );

doc
  .fillColor("#000000")
  .font("Helvetica-Bold")
  .fontSize(13)
  .text(
    `Date: ${new Date().toLocaleDateString("en-GB")}`,
    PAGE_LEFT,
    headerY + headerHeight + 1,
    { width: TABLE_WIDTH, align: "right" }
  );

  let y = headerY + headerHeight + 20;
  y = drawTableHeader(y);

  doc.font("Helvetica").fontSize(FONT_SIZE);

  records.forEach((record, index) => {
    const rowHeight = getRowHeight(record);

    if (y + rowHeight > doc.page.height - 60) {
      doc.addPage();
      y = 30;
      y = drawTableHeader(y);
    }

    drawRow(record, index, y, rowHeight);
    y += rowHeight;
  });


  y += 10;
  const totalHeight = 38;

  if (y + totalHeight > doc.page.height - 30) {
    doc.addPage();
    y = 30;
  }

  doc.rect(pageLeft, y, tableWidth, totalHeight).fill("#e8e8e8");
  doc.rect(pageLeft, y, tableWidth, totalHeight).stroke();

  doc
    .fillColor("#000000")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(
      `TOTAL SFT: ${totals.totalSft.toLocaleString()}`,
      pageLeft + 15,
      y + 13
    );

  doc.text(
    `TOTAL AMOUNT: Rs. ${totals.totalRate.toLocaleString()}`,
    pageLeft + tableWidth / 2,
    y + 13,
    { width: tableWidth / 2 - 15, align: "right" }
  );

  doc.end();
});