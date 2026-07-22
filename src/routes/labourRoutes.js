const {
  addLabour,
  getAllLabour,
  updateLabour,
  deleteLabour,
  getLabourDropdownList,
  exportLabourRecordsExcel,
  exportLabourRecordsPdf,
  addLabourExpense,
  getAllLabourExpense,
  updateLabourExpense,
  deleteLabourExpense,
  getOneLabourExpense,
  getLabourExpenseSummary,
  exportLabourExpenseExcel,
  exportLabourExpensePdf
} = require("../controllers/labourController");
const { protect, checkActionAccess } = require("../middlewares/protect");
const { printRequest } = require("../logger")("Labour_CONTROLLER");

const router = require("express").Router();

router.post("/add_labour", protect, printRequest, checkActionAccess("labour", "create"), addLabour);
router.post("/add_labour_expense", protect, printRequest, checkActionAccess("labour", "create"), addLabourExpense);

router.get('/all_labours', protect, printRequest, checkActionAccess("labour", "view"), getAllLabour);
router.get('/all_labours_expenses', protect, printRequest, checkActionAccess("labour", "view"), getAllLabourExpense);
router.get('/labours_list', protect, printRequest, checkActionAccess("labour", "view"), getLabourDropdownList);


router.post("/labours_records/export-excel", protect, printRequest, checkActionAccess("labour", "view"), exportLabourRecordsExcel);
router.post("/labours_records/export-pdf", protect, printRequest, checkActionAccess("labour", "view"), exportLabourRecordsPdf);
router.post(
  "/expense_records/export-excel",
  protect,
  printRequest,
  checkActionAccess("labour", "view"),
  exportLabourExpenseExcel
);

router.post(
  "/expense_records/export-pdf",
  protect,
  printRequest,
  checkActionAccess("labour", "view"),
  exportLabourExpensePdf
);
router.get("/expense-summary", protect, printRequest, checkActionAccess("labour", "view"), getLabourExpenseSummary);
router.put('/labour_expense/:id', printRequest, protect, checkActionAccess("labour", "update"), updateLabourExpense)
router.delete('/labour_expense/:id', printRequest, protect, checkActionAccess("labour", "update"), deleteLabourExpense)
router.get('/labour_expense/:id', printRequest, protect, checkActionAccess("labour", "update"), getOneLabourExpense)
router.route('/:id')
    .put(printRequest, protect, checkActionAccess("labour", "update"), updateLabour)
    .delete(printRequest, protect, checkActionAccess("labour", "delete"), deleteLabour)

module.exports = router;