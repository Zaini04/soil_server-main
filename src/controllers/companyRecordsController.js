const CompanyRecords = require("../models/companyRecordsModel");
const Site = require("../models/siteModel");
const APIFeatures = require("../utils/APIFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { sendSuccessResponse } = require("../utils/helpers");
const { POSTJoiCompanyRecordsSchema, GETJoiCompanyRecordsSchema } = require("../validations/companyRecordsValidation");
const logger = require("../logger")("CompanyRecords_CONTROLLER");
const handlerFactory = require('./factories/handlerFactory');
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

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
    { path: "client", select: "name" },
    { path: "site", select: "siteName" },
    { path: "vehicle", select: "vehicleNo  typeVehicle" },
    { path: "createdBy", select: "username" },
  ];

  handlerFactory.getAllByField(CompanyRecords,"client",populateOptions,logger,"date")(req, res, next)

});

exports.updateCompanyRecord = catchAsync(async(req,res, next)=>{

    const { value: validData, error } = POSTJoiCompanyRecordsSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  req.body = validData;
  handlerFactory.updateOne(CompanyRecords, logger)(req, res, next);

})

exports.deleteCompanyRecord = handlerFactory.removeFromDb(CompanyRecords, logger);





exports.exportCompanyRecordsExcel = catchAsync(async (req, res) => {
  const clientId = req.params.id;
  const { ids = [] } = req.body;

  let query = {
    client: clientId,
  };

  // Selected rows export
  if (ids.length > 0) {
    query._id = { $in: ids };
  }

  // Site name => Site IDs
  if (req.query.site) {
    const sites = await Site.find({
      siteName: {
        $regex: req.query.site,
        $options: "i",
      },
    }).select("_id");

    req.query.site = sites.map((s) => s._id);
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
    { header: "Client", key: "client", width: 25 },
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
      client: record.client?.name,
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

  // ─── PAGE CONSTANTS ───────────────────────────────────────────
  const pageLeft = 30;
  const pageRight = doc.page.width - 30;
  const tableWidth = pageRight - pageLeft; // 555

  // ─── COLUMN DEFINITIONS ───────────────────────────────────────
  // Sr(20) | Date(65) | Bilty(50) | Site(80) | Vehicle(60) | Material(70) | Rate(50) | SFT(50) | Amount(110)
  // Total = 20+65+50+80+60+70+50+50+110 = 555
  const cols = {
    sr:       { x: pageLeft,       w: 30  },
    date:     { x: pageLeft + 20,  w: 65  },
    bilty:    { x: pageLeft + 85,  w: 50  },
    site:     { x: pageLeft + 135, w: 80  },
    vehicle:  { x: pageLeft + 215, w: 60  },
    material: { x: pageLeft + 275, w: 70  },
    rate:     { x: pageLeft + 345, w: 50  },
    sft:      { x: pageLeft + 395, w: 50  },
    total:    { x: pageLeft + 445, w: 110 },
  };

  const PADDING = { top: 5, bottom: 5, left: 4 };
  const HEADER_HEIGHT = 28;
  const MIN_ROW_HEIGHT = 22;
  const FONT_SIZE = 8;

  // ─── HELPER: draw table header ────────────────────────────────
  const drawTableHeader = (y) => {
    // Light gray header background
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

    // Column dividers
    doc.strokeColor("#999999").lineWidth(0.5);
    Object.values(cols).slice(1).forEach(({ x }) => {
      doc.moveTo(x, y).lineTo(x, y + HEADER_HEIGHT).stroke();
    });

    // Outer border
    doc.rect(pageLeft, y, tableWidth, HEADER_HEIGHT).stroke();

    return y + HEADER_HEIGHT;
  };

  // ─── HELPER: calculate row height ─────────────────────────────
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

  // ─── HELPER: draw one data row ─────────────────────────────────
  const drawRow = (record, index, y, rowHeight) => {
    const bg = index % 2 === 0 ? "#f9f9f9" : "#ffffff";
    doc.rect(pageLeft, y, tableWidth, rowHeight).fill(bg);

    doc.font("Helvetica").fontSize(FONT_SIZE).fillColor("#000000");

    const textY = y + PADDING.top;

    doc.text(String(index + 1), cols.sr.x + PADDING.left, textY, {
      width: cols.sr.w - PADDING.left * 2,
      lineBreak: false,
    });

    doc.text(
      new Date(record.date).toLocaleDateString("en-GB"),
      cols.date.x + PADDING.left,
      textY,
      { width: cols.date.w - PADDING.left * 2, lineBreak: false }
    );

    doc.text(record.biltyNo || "", cols.bilty.x + PADDING.left, textY, {
      width: cols.bilty.w - PADDING.left * 2,
      lineBreak: false,
    });

    doc.text(record.site?.siteName || "", cols.site.x + PADDING.left, textY, {
      width: cols.site.w - PADDING.left * 2,
    });

    doc.text(record.vehicle?.vehicleNo || "", cols.vehicle.x + PADDING.left, textY, {
      width: cols.vehicle.w - PADDING.left * 2,
    });

    doc.text(record.materialType || "", cols.material.x + PADDING.left, textY, {
      width: cols.material.w - PADDING.left * 2,
    });

    doc.text(
      record.rate?.toLocaleString() || "0",
      cols.rate.x + PADDING.left,
      textY,
      { width: cols.rate.w - PADDING.left * 2, lineBreak: false }
    );

    doc.text(
      record.totalSft?.toLocaleString() || "0",
      cols.sft.x + PADDING.left,
      textY,
      { width: cols.sft.w - PADDING.left * 2, lineBreak: false }
    );

    doc.text(
      record.totalRate?.toLocaleString() || "0",
      cols.total.x + PADDING.left,
      textY,
      { width: cols.total.w - PADDING.left * 2, lineBreak: false }
    );

    // Column dividers
    doc.strokeColor("#cccccc").lineWidth(0.5);
    Object.values(cols).slice(1).forEach(({ x }) => {
      doc.moveTo(x, y).lineTo(x, y + rowHeight).stroke();
    });

    // Row border
    doc.rect(pageLeft, y, tableWidth, rowHeight).stroke();
  };

  // ══════════════════════════════════════════════════════════════
  // DOCUMENT HEADER
  // ══════════════════════════════════════════════════════════════
  const headerY = 30;
  const headerHeight = 60;

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

  doc
    .fillColor("#000000")
    .font("Helvetica")
    .fontSize(9)
    .text(
      `Date: ${new Date().toLocaleDateString("en-GB")}`,
      pageLeft,
      headerY + headerHeight + 8,
      { width: tableWidth, align: "right" }
    );

  // ══════════════════════════════════════════════════════════════
  // TABLE
  // ══════════════════════════════════════════════════════════════
  let y = headerY + headerHeight + 28;
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

  // ══════════════════════════════════════════════════════════════
  // TOTALS SECTION
  // ══════════════════════════════════════════════════════════════
  y += 10;
  const totalHeight = 38;

  if (y + totalHeight > doc.page.height - 30) {
    doc.addPage();
    y = 30;
  }

  // Light gray background for totals
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