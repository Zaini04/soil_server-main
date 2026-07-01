const { entryPumpBills, getAllPumpBills, updatePumpBillEntry, deletePumpBillEntry, exportPumpBillsRecordsExcel, exportPumpBillsRecordsPdf } = require("../controllers/pumpBillsController");
const { protect, checkActionAccess } = require("../middlewares/protect");

const router = require("express").Router();
const { printRequest } = require("../logger")("OfficeExpense_CONTROLLER");


router.post("/entry" ,protect,printRequest,checkActionAccess("pump-bills","create"), entryPumpBills);
router.get('/all_entries' ,protect, printRequest  , checkActionAccess("pump-bills","view") , getAllPumpBills);
router.put("/entry/:id" ,protect,printRequest,checkActionAccess("pump-bills","update"), updatePumpBillEntry);
router.delete("/entry/:id" ,protect,printRequest,checkActionAccess("pump-bills","delete"), deletePumpBillEntry);

router.post("/pump_records/export-excel",protect, printRequest  , checkActionAccess("pump-bills","view"),exportPumpBillsRecordsExcel);
router.post("/pump_records/export-pdf",protect, printRequest  , checkActionAccess("pump-bills","view"),exportPumpBillsRecordsPdf);

module.exports = router;
