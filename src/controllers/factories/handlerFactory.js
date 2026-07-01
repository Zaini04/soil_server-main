const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const { sendSuccessResponse } = require('../../utils/helpers');
const bcrypt = require('bcryptjs');
const APIFeatures = require('../../utils/APIFeatures');
const uploadImage = require('../../utils/uploadImage');
const { uploadBase64Image } = require('../../utils/uploadFiles');
const Client = require('../../models/clientModel');
const FuelCompany = require('../../models/fuelCompany');
const Site = require('../../models/siteModel');
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

exports.createOne = (Model , docValidation = null , logger , options = {} ) => catchAsync(async(req , res , next) => {
    const { imageField = 'image', isSingleImage = true , imgDir } = options;
    
    // Handle single image upload
    if (req.file && isSingleImage) {
        const newImage = req.file.location;
        req.body[imageField] = newImage;
    }

    // Handle multiple images upload
    if (req.files && !isSingleImage && req.files.length > 0) {
        const newImages = req.files.map(file => file.location);
        req.body[imageField] = [...doc[imageField], ...newImages]; // Append new images to existing ones
    }

    if(docValidation){
        const { error } = docValidation.validate(req.body);
        if(error){
            return next(new AppError(error.details[0].message , 400))
        }
    }

    const newDoc = await Model.create({...req.body,createdBy:req.user._id});
    return sendSuccessResponse(res , 201 , logger , {
        message : 'Created successfully.' ,
        doc : newDoc 
    })
});

exports.getMy = (Model, populateItems = {}, logger, query = {}) => {
    return catchAsync(async (req, res, next) => {
        query = { ...query, user: req.user._id };
        const features = new APIFeatures(Model.find(query), req.query)
            .filter()
            .limitFields()
            .sort()
            .paginate();

        const docs = await features.query.populate(populateItems);
        const docsCount = await Model.countDocuments({...query , ...features.queryObj});
        const pages = Math.ceil(docsCount / features.pageSize);

        sendSuccessResponse(res, 200, logger, {
            docs,
            page: features.page,
            pages,
            docsCount,
        });
    });
};

exports.getAll = (Model, populateItems = {}, logger, query = {},  dateField = "createdAt") => {
    return catchAsync(async (req, res, next) => {;

        if (req.query.client) {
  const clients = await Client.find({
    name: {
      $regex: req.query.client,
      $options: "i",
    },
  }).select("_id");

  req.query.client = clients.map((c) => c._id);
}
  if (req.query.fuelCompany) {
  const fuelCompanies = await FuelCompany.find({
    fuelCompany: {
      $regex: req.query.fuelCompany,
      $options: "i",
    },
  }).select("_id");

  req.query.fuelCompany = fuelCompanies.map((c) => c._id);
}

        const features = await new APIFeatures(Model.find(query), req.query,dateField)
            .filter()
            .limitFields()
            .sort()
            .paginate();
            

        const docs = await features.query.populate(populateItems);
        const docsCount = await Model.countDocuments({...query , ...features.queryObj});
        const pages = Math.ceil(docsCount / features.pageSize);

        sendSuccessResponse(res, 200, logger, {
            docs,
            page: features.page,
            pages,
            docsCount,
        });
    });
};

exports.getTotal = (Model, populateItems = '' , logger) => catchAsync(async(req , res , next) => {
    const features = new APIFeatures(Model.find() , req.query)
    .filter()
    .limitFields()
    .sort();  

    const docs = await features.query.populate(populateItems)
    const docCount = await Model.countDocuments(features.queryObj);
    
    sendSuccessResponse(res , 200 , logger , {
        docs , docCount 
    });
});

exports.getOne = (Model, populateItems = '', logger, paramName = 'id', field = '_id') => catchAsync(async (req, res, next) => {
    const value = req.params[paramName];
    
    let query;
    if (field === '_id') {
        query = Model.findById(value);
    } else {
        query = Model.findOne({ [field] : value });
    }

    const doc = await query.populate(populateItems);
    if (!doc) return next(new AppError(`No record found with that ${field}.`, 404));
    sendSuccessResponse(res, 200, logger, { doc });
});

exports.updateOne = (Model, logger, options = {}) => catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { imageField = 'image', isSingleImage = true } = options;

    const doc = await Model.findById(id);
    if (!doc) {
        return next(new AppError('Document not found.', 404));
    }

    if(doc?.isSuperAdmin){
        return next(new AppError('You can not update super admin user.', 400));
    }
    // Handle single image upload
    // if (req.file && isSingleImage) {
    //     const newImage = req.file.location;
    //     req.body[imageField] = newImage;
    // }

    // // Handle multiple images upload
    // if (req.files && !isSingleImage && req.files.length > 0) {
    //     const newImages = req.files.map(file => file.location);
    //     req.body[imageField] = [...doc[imageField], ...newImages]; // Append new images to existing ones
    // }


    console.log(req.body);

      if(req.body.image && req.body.image.startsWith('data:image/')) {

         const base64String = req.body.image.split(",")[1];
        const uploadDir = `/uploads/${req.uploadDirectory}`;
    
        const result = await uploadBase64Image(base64String, uploadDir);
        const relativeAddress = `${req.uploadDirectory}/${result.fileName}`;
        req.body.image = relativeAddress;
      }
      
    if (req.body.password) {
        req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    
    const updatedDoc = await Model.findByIdAndUpdate(id, {...req.body,updateBy:req.user._id}, {
        new: true,
        runValidators: true,
        
    });

    return sendSuccessResponse(res, 200, logger, {
        message: 'Updated successfully.',
        doc: updatedDoc
    });
});


exports.deleteOne = (Model , logger ) => catchAsync(async( req , res , next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id , { status :  'Deleted'} , {
        new : true 
    });
    if(doc?.isSuperAdmin){
        return next(new AppError('You can not update super admin user.', 400));
    }
    if(!doc){
        return next(new AppError('Document not found.' , 404))
    }
    sendSuccessResponse(res , 200 , logger , {
        message : 'Deleted successfully.' ,
        doc
    })
});

exports.removeFromDb = (Model , logger ) => catchAsync(async( req , res , next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    
    sendSuccessResponse(res , 200 , logger , {
        message : 'Deleted successfully.' ,
    })
});


exports.getAllByField = (
  Model,
  field,
  populateItems = [],
  logger,
  dateField = "createdAt"
) =>
  catchAsync(async (req, res, next) => {
    const value = req.params.id;

if (req.query.site) {
  const sites = await Site.find({
    siteName: {
      $regex: req.query.site,
      $options: "i",
    },
  }).select("_id");

  req.query.site = sites.map((c) => c._id);

}

    const features = new APIFeatures(
      Model.find({ [field]: value }),
      req.query,
      dateField
    )
      .filter()
      .limitFields()
      .sort()
      .paginate();

    const docs = await features.query.populate(populateItems);

    const docsCount = await Model.countDocuments({
      [field]: value,
      ...features.queryObj,
    });

    sendSuccessResponse(res, 200, logger, {
      docs,
      page: features.page,
      pages: Math.ceil(docsCount / features.pageSize),
      docsCount,
    });
  });


 




const fetchExportRecords = async (Model, options, req) => {
  const {
    buildQuery,
    dateField = "createdAt",
    populate = [],
    sortField,
  } = options;


  let baseQuery = buildQuery(req);

  const { ids = [] } = req.body || {};
  if (ids.length > 0) {
    baseQuery._id = { $in: ids };
  }

  const features = new APIFeatures(
    Model.find(baseQuery),
    req.query,
    dateField
  ).filter();


  let q = features.query;
  populate.forEach((p) => (q = q.populate(p)));

  const sort = sortField || dateField;
  const records = await q.sort({ [sort]: -1 });

  return records;
};



const computeTotals = (records, totalsConfig = []) => {
  const init = {};
  totalsConfig.forEach(({ field }) => (init[field] = 0));

  return records.reduce((acc, item) => {
    totalsConfig.forEach(({ field, compute }) => {
      if (compute) {
        acc[field] += compute(item) || 0;
      } else {
        const value = field.split(".").reduce((obj, key) => obj?.[key], item);
        acc[field] += value || 0;
      }
    });
    return acc;
  }, init);
};

exports.exportExcel = (Model, options) =>
  catchAsync(async (req, res) => {
    const { columns = [], totalsConfig = [], sheetName = "Records" } = options;

    const records = await fetchExportRecords(Model, options, req);
    const totals = computeTotals(records, totalsConfig);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.excelWidth || Math.round((col.width || 80) / 5),
    }));

    worksheet.getRow(1).font = { bold: true };

    records.forEach((record) => {
      const row = {};
      columns.forEach((col) => {
        row[col.key] = col.getValue(record);
      });
      worksheet.addRow(row);
    });

    worksheet.addRow([]);

    if (totalsConfig.length > 0) {
      const totalRow = {};
      totalRow[columns[0].key] = "TOTAL";
      totalsConfig.forEach(({ field, prefix = "" }) => {
        totalRow[field] = `${prefix}${totals[field]?.toLocaleString()}`;
      });
      const excelTotalRow = worksheet.addRow(totalRow);
      excelTotalRow.font = { bold: true };
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=export-${Date.now()}.xlsx`
    );
    await workbook.xlsx.write(res);
    res.end();
  });


exports.exportPdf = (Model, options) =>
  catchAsync(async (req, res) => {
    const {
      columns = [],        
      totalsConfig = [],   
      title: getTitle,     
    } = options;

    const records = await fetchExportRecords(Model, options, req);

    if (!records.length) {
      return res.status(404).json({ success: false, message: "No records found" });
    }

    const totals = computeTotals(records, totalsConfig);
    const titleText = typeof getTitle === "function"
      ? getTitle(records)
      : getTitle || "Records";

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=export-${Date.now()}.pdf`
    );
    doc.pipe(res);

    const PAGE_LEFT   = 30;
    const PAGE_RIGHT  = doc.page.width - 30;
    const TABLE_WIDTH = PAGE_RIGHT - PAGE_LEFT;
    const PADDING     = { top: 5, bottom: 5, left: 4 };
    const HEADER_H    = 28;
    const MIN_ROW_H   = 22;
    const FONT_SIZE   = 8;

    const SR_WIDTH = 30;
    const userColsTotal = columns.reduce((s, c) => s + c.width, 0);
    const scale = (TABLE_WIDTH - SR_WIDTH) / userColsTotal;
    let xCursor = PAGE_LEFT + SR_WIDTH;
    const colDefs = columns.map((col) => {
      const w = Math.round(col.width * scale);
      const def = { ...col, x: xCursor, w };
      xCursor += w;
      return def;
    });

    const drawTableHeader = (y) => {
      doc.rect(PAGE_LEFT, y, TABLE_WIDTH, HEADER_H).fill("#e8e8e8");
      doc.font("Helvetica-Bold").fontSize(FONT_SIZE).fillColor("#000000");

      doc.text("Sr#", PAGE_LEFT + PADDING.left, y + PADDING.top + 4, {
        width: SR_WIDTH - PADDING.left * 2,
        lineBreak: false,
      });

      colDefs.forEach((col) => {
        doc.text(col.header, col.x + PADDING.left, y + PADDING.top + 4, {
          width: col.w - PADDING.left * 2,
          lineBreak: false,
        });
      });

      doc.strokeColor("#999999").lineWidth(0.5);
      colDefs.forEach(({ x }) => {
        doc.moveTo(x, y).lineTo(x, y + HEADER_H).stroke();
      });
      doc.rect(PAGE_LEFT, y, TABLE_WIDTH, HEADER_H).stroke();

      return y + HEADER_H;
    };

    const getRowHeight = (record) => {
      doc.font("Helvetica").fontSize(FONT_SIZE);
      let maxH = MIN_ROW_H;
      colDefs.forEach((col) => {
        if (!col.wrap) return;
        const text = col.getValue(record) || "";

        const h = doc.heightOfString(text, { width: col.w - PADDING.left * 2 })
          + PADDING.top + PADDING.bottom;
        if (h > maxH) maxH = h;
      });
      return Math.max(maxH, MIN_ROW_H);
    };

    const drawRow = (record, index, y, rowH) => {
      const bg = index % 2 === 0 ? "#f9f9f9" : "#ffffff";
      doc.rect(PAGE_LEFT, y, TABLE_WIDTH, rowH).fill(bg);
      doc.font("Helvetica").fontSize(FONT_SIZE).fillColor("#000000");

      const textY = y + PADDING.top;

      doc.text(String(index + 1), PAGE_LEFT + PADDING.left, textY, {
        width: SR_WIDTH - PADDING.left * 2,
        lineBreak: false,
      });

      colDefs.forEach((col) => {
        const val = col.getValue(record) ?? "";
        doc.text(val, col.x + PADDING.left, textY, {
          width: col.w - PADDING.left * 2,
          lineBreak: col.wrap ? true : false,
        });
      });

      doc.strokeColor("#cccccc").lineWidth(0.5);
      colDefs.forEach(({ x }) => {
        doc.moveTo(x, y).lineTo(x, y + rowH).stroke();
      });
      doc.rect(PAGE_LEFT, y, TABLE_WIDTH, rowH).stroke();
    };

    const headerY = 30;
    const headerH = 60;
    doc.rect(PAGE_LEFT, headerY, TABLE_WIDTH, headerH).fill("#000000");
    const titleH = doc.heightOfString(titleText, { width: TABLE_WIDTH });
    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(20)
      .text(titleText, PAGE_LEFT, headerY + (headerH - titleH) / 2, {
        width: TABLE_WIDTH,
        align: "center",
      });
    doc
      .fillColor("#000000")
      .font("Helvetica")
      .fontSize(9)
      .text(
        `Date: ${new Date().toLocaleDateString("en-GB")}`,
        PAGE_LEFT,
        headerY + headerH + 8,
        { width: TABLE_WIDTH, align: "right" }
      );

    let y = headerY + headerH + 28;
    y = drawTableHeader(y);

    records.forEach((record, index) => {
      const rowH = getRowHeight(record);
      if (y + rowH > doc.page.height - 60) {
        doc.addPage();
        y = 30;
        y = drawTableHeader(y);
      }
      drawRow(record, index, y, rowH);
      y += rowH;
    });

    if (totalsConfig.length > 0) {
      y += 15;
      const TOTAL_H =60 ;
      if (y + TOTAL_H > doc.page.height - 30) {
        doc.addPage();
        y = 30;
      }

      doc.rect(PAGE_LEFT, y, TABLE_WIDTH, TOTAL_H).fill("#e8e8e8");
      doc.rect(PAGE_LEFT, y, TABLE_WIDTH, TOTAL_H).stroke();

      doc.fillColor("#000000").font("Helvetica-Bold").fontSize(10);

      const half = TABLE_WIDTH / 2;
      const leftTotals  = totalsConfig.filter((_, i) => i % 2 === 0);
      const rightTotals = totalsConfig.filter((_, i) => i % 2 !== 0);

      leftTotals.forEach((t, i) => {
        doc.text(
          `${t.label}: ${t.prefix || ""}${totals[t.field]?.toLocaleString()}`,
          PAGE_LEFT + 15,
          y + 11 + i * 14
        );
      });

      rightTotals.forEach((t, i) => {
        doc.text(
          `${t.label}: ${t.prefix || ""}${totals[t.field]?.toLocaleString()}`,
          PAGE_LEFT + half,
          y + 11 + i * 14,
          { width: half - 15, align: "right" }
        );
      });
    }

    doc.end();
  });