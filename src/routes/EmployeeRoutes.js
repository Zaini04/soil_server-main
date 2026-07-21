const { addEmployee, getAllEmployee, updateEmployee, deleteEmployee, getEmployeeDropdownList, exportEmployeeRecordsExcel, exportEmployeeRecordsPdf, addEmployeeExpense, getAllEmployeeExpense, updateEmployeeExpense, deleteEmployeeExpense, getOneEmployeeExpense, getEmployeeExpensesByEmployeeId, getEmployeeExpenseSummary, exportEmployeeExpenseExcel, exportEmployeeExpensePdf } = require("../controllers/employeeController");
const { protect, checkActionAccess } = require("../middlewares/protect");
const { printRequest } = require("../logger")("Employee_CONTROLLER");

const router = require("express").Router();

router.post("/add_employee" ,protect,printRequest,checkActionAccess("employee","create"), addEmployee);
router.post("/add_employee_expense" ,protect,printRequest,checkActionAccess("employee","create"), addEmployeeExpense);

router.get('/all_employees' ,protect, printRequest  , checkActionAccess("emoloyee","view") , getAllEmployee);
router.get('/all_employees_expenses' ,protect, printRequest  , checkActionAccess("emoloyee","view") , getAllEmployeeExpense);
router.get('/employees_list' ,protect, printRequest  , checkActionAccess("employee","view") , getEmployeeDropdownList);


router.post("/employees_records/export-excel",protect, printRequest  , checkActionAccess("employee","view"),exportEmployeeRecordsExcel);
router.post("/employees_records/export-pdf",protect, printRequest  , checkActionAccess("employee","view"),exportEmployeeRecordsPdf);
router.post(
  "/expense_records/export-excel",
  protect,
  printRequest,
  checkActionAccess("employee", "view"), // module name apne access-control setup ke mutabiq confirm kar lein
  exportEmployeeExpenseExcel
);

router.post(
  "/expense_records/export-pdf",
  protect,
  printRequest,
  checkActionAccess("employee", "view"),
  exportEmployeeExpensePdf
);
router.get("/expense-summary", protect,printRequest ,checkActionAccess("employee","view"), getEmployeeExpenseSummary);
router.put('/employee_expense/:id',printRequest , protect , checkActionAccess("employee","update"),updateEmployeeExpense )
router.delete('/employee_expense/:id',printRequest , protect , checkActionAccess("employee","update"),deleteEmployeeExpense )
router.get('/employee_expense/:id',printRequest , protect , checkActionAccess("employee","update"),getEmployeeExpensesByEmployeeId )
router.route('/:id')
    .put(printRequest , protect , checkActionAccess("employee","update"),updateEmployee )
    .delete(printRequest , protect , checkActionAccess("employee","delete"), deleteEmployee )

module.exports = router;
