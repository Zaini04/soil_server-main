const AppError = require("../utils/appError");
const { sendSuccessResponse } = require("../utils/helpers");
const catchAsync = require('../utils/catchAsync');
const logger = require("../logger")("LABOUR_CONTROLLER");
const handlerFactory = require('./factories/handlerFactory');
const Labour = require("../models/LabourModel");
const LabourExpense = require("../models/LabourExpenseModel");
const { LabourValidation, GETJoiLabourSchema, PATCHJoiLabourSchema } = require("../validations/labourValidations");
const { POSTJoiLabourExpenseSchema, GETJoiLabourExpenseSchema } = require("../validations/labourExpenseValidations");


const labourRecordColumns = [
    { header: "Date", key: "date", width: 65, getValue: (r) => new Date(r.createdAt).toLocaleDateString("en-GB") },
    { header: "Labour Name", key: "name", width: 50, getValue: (r) => r.name || "" },
    { header: "Phone No", key: "phoneNumber", width: 60, getValue: (r) => r.phoneNumber || "", wrap: true },
    { header: "Location", key: "city", width: 60, getValue: (r) => r.city || "", wrap: true },
    { header: "Status", key: "status", width: 60, getValue: (r) => r.status || "", wrap: true },
];

const labourRecordPopulate = [];

exports.exportLabourRecordsExcel = handlerFactory.exportExcel(Labour, {
    buildQuery: (req) => ({}),
    dateField: "createdAt",
    populate: labourRecordPopulate,
    columns: labourRecordColumns,
    totalsConfig: [],
    sheetName: "Labour Records",
});

exports.exportLabourRecordsPdf = handlerFactory.exportPdf(Labour, {
    buildQuery: (req) => ({}),
    dateField: "createdAt",
    populate: labourRecordPopulate,
    columns: labourRecordColumns,
    totalsConfig: [],
    title: "Labour Records",
});

exports.addLabour = catchAsync(async (req, res, next) => {
    const {
        name,
        fatherOrHusbandName,
        cnicOrNicop,
        phoneNumber,
        whatsAppNumber,
        email,
        address,
        city,
        state,
        status,
        image,
    } = req.body;

    const { error } = LabourValidation.validate(req.body);
    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }

    const labourExists = await Labour.findOne({ cnicOrNicop });
    if (labourExists) {
        return next(new AppError("Labour with this CNIC/NICOP already exists.", 400));
    }

    await Labour.create({
        name,
        fatherOrHusbandName,
        cnicOrNicop,
        phoneNumber,
        whatsAppNumber,
        email,
        address,
        city,
        state,
        status,
        image,
        createdBy: req.user._id
    });

    return sendSuccessResponse(res, 201, logger, {
        message: "Labour added successfully.",
    });
});

exports.getAllLabour = catchAsync(async (req, res, next) => {
    const { value: validQuery, error } = GETJoiLabourSchema.validate(req.query);
    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }
    req.query = validQuery;

    const query = {};
    const populateOptions = [
        { path: "createdBy", select: "username" },
    ];
    handlerFactory.getAll(Labour, populateOptions, logger, query)(req, res, next);
});

exports.updateLabour = catchAsync(async (req, res, next) => {
    const { value: validData, error } = PATCHJoiLabourSchema.validate(req.body);
    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }

    if (validData.cnicOrNicop) {
        const duplicateLabour = await Labour.findOne({
            cnicOrNicop: validData.cnicOrNicop,
            _id: { $ne: req.params.id }
        });
        if (duplicateLabour) {
            return next(new AppError("This CNIC / NICOP number is already assigned to another Labour.", 400));
        }
    }

    req.body = validData;
    handlerFactory.updateOne(Labour, logger)(req, res, next);
});

exports.deleteLabour = handlerFactory.deleteOne(Labour, logger);

exports.getLabourDropdownList = async (req, res, next) => {
    try {
        const labours = await Labour.find({ status: "Active" })
            .select("_id name phoneNumber")
            .lean();

        sendSuccessResponse(res, 200, logger, {
            message: "labour dropdown list",
            docs: labours
        });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};


exports.addLabourExpense = catchAsync(async (req, res, next) => {
    const { value: validData, error } = POSTJoiLabourExpenseSchema.validate(req.body);
    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }

    const labour = await Labour.findById(validData.labour).select("name");
    if (!labour) {
        return next(new AppError("Labour not found.", 404));
    }

    req.body = validData;
    handlerFactory.createOne(LabourExpense, POSTJoiLabourExpenseSchema, logger)(req, res, next);
});

exports.getAllLabourExpense = catchAsync(async (req, res, next) => {
    const { value: validQuery, error } = GETJoiLabourExpenseSchema.validate(req.query);
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
        { path: "labour", select: "name phoneNumber city status" },
    ];

    handlerFactory.getAll(LabourExpense, populateOptions, logger, query, "date")(req, res, next);
});

exports.updateLabourExpense = catchAsync(async (req, res, next) => {
    const { value: validData, error } = POSTJoiLabourExpenseSchema.validate(req.body);
    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }

    const existingExpense = await LabourExpense.findById(req.params.id);
    if (!existingExpense) {
        return next(new AppError("Expense record not found.", 404));
    }

    req.body = validData;
    handlerFactory.updateOne(LabourExpense, logger)(req, res, next);
});

exports.deleteLabourExpense = handlerFactory.removeFromDb(LabourExpense, logger);

exports.getOneLabourExpense = handlerFactory.getOne(LabourExpense, [
    { path: "createdBy", select: "username" },
    { path: "labour", select: "name phoneNumber" }
], logger);

exports.getLabourExpenseSummary = catchAsync(async (req, res, next) => {
    const { labour, from, to } = req.query;

    if (!labour) {
        return next(new AppError("Labour id is required.", 400));
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

    const lab = await Labour.findById(labour).select("name phoneNumber");
    if (!lab) {
        return next(new AppError("Labour not found.", 404));
    }

    const agg = await LabourExpense.aggregate([
        {
            $match: {
                labour: lab._id,
                date: { $gte: startDate, $lte: endDate },
            },
        },
        { $group: { _id: null, totalSpent: { $sum: "$amount" } } },
    ]);

    const totalSpent = agg[0]?.totalSpent || 0;

    sendSuccessResponse(res, 200, logger, {
        labour: {
            _id: lab._id,
            name: lab.name,
            phoneNumber: lab.phoneNumber,
        },
        totalSpent,
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

const fetchAllLaboursSummary = async (req) => {
    const { startDate, endDate } = getExportPeriod(req);

    const agg = await LabourExpense.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: "$labour", totalExpense: { $sum: "$amount" } } },
    ]);

    const expenseMap = {};
    agg.forEach((e) => (expenseMap[e._id.toString()] = e.totalExpense));

    const labours = await Labour.find({ status: "Active" })
        .select("name phoneNumber")
        .lean();

    return labours.map((lab) => ({
        ...lab,
        totalExpense: expenseMap[lab._id.toString()] || 0,
    }));
};

const labourSummaryColumns = [
    { header: "Labour", key: "name", width: 60, getValue: (r) => r.name || "" },
    { header: "Phone", key: "phoneNumber", width: 50, getValue: (r) => r.phoneNumber || "" },
    { header: "Total Expense", key: "totalExpense", width: 50, getValue: (r) => r.totalExpense ?? 0 },
];

const labourSummaryTotals = (records) => ({
    totalExpense: records.reduce((sum, r) => sum + (r.totalExpense || 0), 0),
});

const labourSummaryTotalsConfig = [
    { label: "TOTAL Expense", field: "totalExpense", prefix: "Rs. " },
];

const fetchSingleLabourExpenseRecords = async (req) => {
    const { startDate, endDate } = getExportPeriod(req);

    return LabourExpense.find({
        labour: req.query.labour,
        date: { $gte: startDate, $lte: endDate },
    })
        .populate([
            { path: "createdBy", select: "username" },
            { path: "labour", select: "name phoneNumber" },
        ])
        .sort({ date: -1 });
};

const labourExpenseDetailColumns = [
    { header: "Date", key: "date", width: 55, getValue: (r) => new Date(r.date).toLocaleDateString("en-GB") },
    { header: "Amount", key: "amount", width: 50, getValue: (r) => r.amount ?? 0 },
    { header: "Notes", key: "notes", width: 80, getValue: (r) => r.notes || "", wrap: true },
];

const labourExpenseDetailTotals = (records) => ({
    totalExpense: records.reduce((sum, r) => sum + (r.amount || 0), 0),
});

const labourExpenseDetailTotalsConfig = [
    { label: "Total Expense", field: "totalExpense", prefix: "Rs. " },
];

const fetchSelectedLabourExpenseRecords = async (req) => {
    const { ids = [] } = req.body || {};

    return LabourExpense.find({ _id: { $in: ids } })
        .populate([
            { path: "createdBy", select: "username" },
            { path: "labour", select: "name phoneNumber" },
        ])
        .sort({ date: -1 });
};

const selectedLabourExpenseTotals = (records) => ({
    totalExpense: records.reduce((sum, r) => sum + (r.amount || 0), 0),
});

const selectedLabourExpenseTotalsConfig = [
    { label: "TOTAL Expense", field: "totalExpense", prefix: "Rs. " },
];

exports.exportLabourExpenseExcel = catchAsync(async (req, res, next) => {
    const hasSelectedIds = Array.isArray(req.body?.ids) && req.body.ids.length > 0;
    const isSingleLabour = !hasSelectedIds && !!req.query.labour;

    if (hasSelectedIds) {
        return handlerFactory.exportExcel(LabourExpense, {
            fetchRecords: fetchSelectedLabourExpenseRecords,
            getTotals: selectedLabourExpenseTotals,
            columns: labourExpenseDetailColumns,
            totalsConfig: selectedLabourExpenseTotalsConfig,
            sheetName: "Labour Expense Records",
        })(req, res, next);
    }

    if (isSingleLabour) {
        const lab = await Labour.findById(req.query.labour).select("name");
        const labourName = lab?.name || "Labour";
        return handlerFactory.exportExcel(LabourExpense, {
            fetchRecords: fetchSingleLabourExpenseRecords,
            getTotals: labourExpenseDetailTotals,
            columns: labourExpenseDetailColumns,
            totalsConfig: labourExpenseDetailTotalsConfig,
            sheetName: `${labourName} - Expense Detail`,
        })(req, res, next);
    }

    return handlerFactory.exportExcel(LabourExpense, {
        fetchRecords: fetchAllLaboursSummary,
        getTotals: labourSummaryTotals,
        columns: labourSummaryColumns,
        totalsConfig: labourSummaryTotalsConfig,
        sheetName: "All Labours Expense Summary",
    })(req, res, next);
});

exports.exportLabourExpensePdf = catchAsync(async (req, res, next) => {
    const hasSelectedIds = Array.isArray(req.body?.ids) && req.body.ids.length > 0;
    const isSingleLabour = !hasSelectedIds && !!req.query.labour;

    if (hasSelectedIds) {
        return handlerFactory.exportPdf(LabourExpense, {
            fetchRecords: fetchSelectedLabourExpenseRecords,
            getTotals: selectedLabourExpenseTotals,
            columns: labourExpenseDetailColumns,
            totalsConfig: selectedLabourExpenseTotalsConfig,
            title: "Labour Expense Records",
        })(req, res, next);
    }

    if (isSingleLabour) {
        const lab = await Labour.findById(req.query.labour).select("name");
        const labourName = lab?.name || "Labour";
        return handlerFactory.exportPdf(LabourExpense, {
            fetchRecords: fetchSingleLabourExpenseRecords,
            getTotals: labourExpenseDetailTotals,
            columns: labourExpenseDetailColumns,
            totalsConfig: labourExpenseDetailTotalsConfig,
            title: `${labourName} - Expense Detail`,
        })(req, res, next);
    }

    return handlerFactory.exportPdf(LabourExpense, {
        fetchRecords: fetchAllLaboursSummary,
        getTotals: labourSummaryTotals,
        columns: labourSummaryColumns,
        totalsConfig: labourSummaryTotalsConfig,
        title: "All Labours Expense Summary",
    })(req, res, next);
});