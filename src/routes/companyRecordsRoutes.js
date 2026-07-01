const { enterComanyRecords, getCompanyRecordsByClient, exportCompanyRecordsExcel, exportCompanyRecordsPdf, updateCompanyRecord, deleteCompanyRecord } = require("../controllers/companyRecordsController");
const { protect, checkActionAccess } = require("../middlewares/protect");

const router = require("express").Router();
const { printRequest } = require("../logger")("CompanyRecords_CONTROLLER");


router.post("/entry" ,protect,printRequest,checkActionAccess("company-records","create"), enterComanyRecords);
router.get('/client_records/:id' ,protect, printRequest  , checkActionAccess("company-records","view") , getCompanyRecordsByClient);
router.post("/client_records/:id/export-excel",protect, printRequest  , checkActionAccess("company-records","view"),exportCompanyRecordsExcel);
router.post("/client_records/:id/export-pdf",protect, printRequest  , checkActionAccess("company-records","view"),exportCompanyRecordsPdf);
router.put("/entry/:id" ,protect,printRequest,checkActionAccess("company-records","update"), updateCompanyRecord);
router.delete("/entry/:id" ,protect,printRequest,checkActionAccess("company-records","delete"), deleteCompanyRecord);

module.exports = router;
