const { enterComanyRecords, getCompanyRecordsByClient, exportCompanyRecordsExcel, exportCompanyRecordsPdf, updateCompanyRecord, deleteCompanyRecord, getAllCompanyExpenses, getCompanyExpenseSummary, exportCompanyExpenseExcel, exportCompanyExpensePdf } = require("../controllers/companyRecordsController");
const { protect, checkActionAccess } = require("../middlewares/protect");

const router = require("express").Router();
const { printRequest } = require("../logger")("CompanyRecords_CONTROLLER");


router.post("/entry" ,protect,printRequest,checkActionAccess("company-records","create"), enterComanyRecords);
router.get('/client_records/:id' ,protect, printRequest  , checkActionAccess("company-records","view") , getCompanyRecordsByClient);
router.get('/all_clients_expenses' ,protect, printRequest  , checkActionAccess("company-records","view") , getAllCompanyExpenses);
router.post("/client_records/:id/export-excel",protect, printRequest  , checkActionAccess("company-records","view"),exportCompanyRecordsExcel);
router.post("/client_records/:id/export-pdf",protect, printRequest  , checkActionAccess("company-records","view"),exportCompanyRecordsPdf);
router.put("/entry/:id" ,protect,printRequest,checkActionAccess("company-records","update"), updateCompanyRecord);
router.delete("/entry/:id" ,protect,printRequest,checkActionAccess("company-records","delete"), deleteCompanyRecord);
router.get("/expense-summary", protect, printRequest, checkActionAccess("company", "view"), getCompanyExpenseSummary);
router.post("/export-excel", protect, printRequest, checkActionAccess("company", "view"), exportCompanyExpenseExcel);
router.post("/export-pdf", protect, printRequest, checkActionAccess("company", "view"), exportCompanyExpensePdf);
module.exports = router;
