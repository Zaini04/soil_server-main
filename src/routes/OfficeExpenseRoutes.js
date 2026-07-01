const { addOfficeExpense, getAllOfficeExpense, exportExpenseRecordsExcel, exportExpenseRecordsPdf, updateOfficeExpense, deleteOfficeExpense } = require("../controllers/officeExpenseController");
const { protect, checkActionAccess } = require("../middlewares/protect");

const router = require("express").Router();
const { printRequest } = require("../logger")("OfficeExpense_CONTROLLER");


router.post("/add" ,protect,printRequest,checkActionAccess("office-Expense","create"), addOfficeExpense);
router.get('/all_expenses' ,protect, printRequest  , checkActionAccess("office-Expense","view") , getAllOfficeExpense);
router.post("/expense_records/export-excel",protect, printRequest  , checkActionAccess("office-Expense","view"),exportExpenseRecordsExcel);
router.post("/expense_records/export-pdf",protect, printRequest  , checkActionAccess("office-Expense","view"),exportExpenseRecordsPdf);
router.put("/:id" ,protect,printRequest,checkActionAccess("office-Expense","update"), updateOfficeExpense);
router.delete("/:id" ,protect,printRequest,checkActionAccess("office-Expense","delete"), deleteOfficeExpense);

module.exports = router;
