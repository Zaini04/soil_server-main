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
  console.log(req.body)

  const { value: validData, error } = POSTJoiCompanyRecordsSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  const {biltyNo} = req.body
  const biltyNoExists= await CompanyRecords.findOne({biltyNo:biltyNo})
  
  if(biltyNoExists){
      return next(new AppError("Bilty number already exists.", 404));
  }
  const entry = await CompanyRecords.create(validData);

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
  ];

  handlerFactory.getAllByField(CompanyRecords,"client",populateOptions,logger,"date")(req, res, next)

});




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

    query.site = {
      $in: sites.map((s) => s._id),
    };
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
    return res.status(404).json({
      success: false,
      message: "No records found",
    });
  }

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

  const clientName = records[0]?.client?.name || "N/A";

  const doc = new PDFDocument({
    margin: 30,
    size: "A4",
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=company-records-${Date.now()}.pdf`
  );

  doc.pipe(res);

  // ==================================================
  // HEADER
  // ============================================
  // ======

  doc.moveDown(2)
const headerY = 20;
const headerWidth = doc.page.width - 60; // 30 left + 30 right margin

doc
  .rect(30, headerY, headerWidth, 70)
  .fill("#000");
  doc
    .fillColor("#fff")
    .fontSize(22)
    .font("Helvetica-Bold")
    .text(`${clientName}`, 0, 20, {
      align: "center",
    });

  // doc
  //   .fontSize(14)
  //   .text(`Client: ${clientName}`, {
  //     align: "center",
  //   });

  doc.moveDown(2);

  doc.fillColor("#000");

  doc
    .fontSize(10)
    .font("Helvetica")
    .text(
      ` Date: ${new Date().toLocaleDateString("en-GB")}`,
      {
        align: "right",
      }
    );

  doc.moveDown();

  // ==================================================
  // TABLE HEADER
  // ==================================================

  let y = doc.y + 10;

  const columns = {
    sr: 30,
    date: 60,
    bilty: 105,
    site: 170,
    vehicle: 255,
    material: 325,
    rate: 405,
    sft: 455,
    total: 510,
  };

  doc.rect(20, y, 560, 25);

  doc.font("Helvetica-Bold").fontSize(8);

  doc.text("Sr#", columns.sr, y + 8);
  doc.text("Date", columns.date, y + 8);
  doc.text("Bilty", columns.bilty, y + 8);
  doc.text("Site", columns.site, y + 8);
  doc.text("Vehicle", columns.vehicle, y + 8);
  doc.text("Material", columns.material, y + 8);
  doc.text("Rate", columns.rate, y + 8);
  doc.text("SFT", columns.sft, y + 8);
  doc.text("Amount", columns.total, y + 8);

  y += 25;

  // ==================================================
  // TABLE DATA
  // ==================================================

  doc.font("Helvetica").fontSize(8);

  records.forEach((record, index) => {
    if (y > 730) {
      doc.addPage();

      y = 40;

      doc.rect(20, y, 560, 25);

      doc.font("Helvetica-Bold");

      doc.text("Sr#", columns.sr, y + 8);
      doc.text("Date", columns.date, y + 8);
      doc.text("Bilty", columns.bilty, y + 8);
      doc.text("Site", columns.site, y + 8);
      doc.text("Vehicle", columns.vehicle, y + 8);
      doc.text("Material", columns.material, y + 8);
      doc.text("Rate", columns.rate, y + 8);
      doc.text("SFT", columns.sft, y + 8);
      doc.text("Amount", columns.total, y + 8);

      y += 25;

      doc.font("Helvetica");
    }

    doc.rect(20, y - 3, 560, 22).stroke();

    doc.text(index + 1, columns.sr, y);
    doc.text(
      new Date(record.date).toLocaleDateString("en-GB"),
      columns.date,
      y
    );
    doc.text(record.biltyNo || "", columns.bilty, y);

    doc.text(
      record.site?.siteName || "",
      columns.site,
      y,
      {
        width: 75,
      }
    );

    doc.text(
      record.vehicle?.vehicleNo || "",
      columns.vehicle,
      y,
      {
        width: 60,
      }
    );

    doc.text(
      record.materialType || "",
      columns.material,
      y,
      {
        width: 70,
      }
    );

    doc.text(
      record.rate?.toLocaleString() || "0",
      columns.rate,
      y
    );

    doc.text(
      record.totalSft?.toLocaleString() || "0",
      columns.sft,
      y
    );

    doc.text(
      record.totalRate?.toLocaleString() || "0",
      columns.total,
      y
    );

    y += 22;
  });

  // ==================================================
  // TOTAL SECTION
  // ==================================================

  y += 15;

  doc.rect(20, y, 560, 35);

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(
      `TOTAL SFT: ${totals.totalSft.toLocaleString()}`,
      40,
      y + 10
    );

  doc.text(
    `TOTAL AMOUNT: Rs. ${totals.totalRate.toLocaleString()}`,
    320,
    y + 10
  );

  doc.end();
});