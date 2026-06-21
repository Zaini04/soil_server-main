const { entryVehicle, getAllEntryVehicles, updateEntryVehicle, deleteEntryVehicle, getEntriesByVehicle, getEntriesByClient, generateBill, recordPayment, getIncomeExpense, getIncomeSummary, dashboard, todayDashboard } = require("../controllers/entryVehicleController");
const { protect, checkActionAccess } = require("../middlewares/protect");
const { printRequest } = require("../logger")("Vehicle_CONTROLLER");

const router = require("express").Router();

router.post("/entry" ,protect,printRequest,checkActionAccess("entry-vehicle","create"), entryVehicle);
router.get('/all_entry_vehicles' ,protect, printRequest  , checkActionAccess("entry-vehicle","view") , getAllEntryVehicles);
router.post('/generate_bill/:id' ,protect, printRequest  , checkActionAccess("entry-vehicle","view") , generateBill);
router.post('/payment/:id' ,protect, printRequest  , checkActionAccess("entry-vehicle","view") , recordPayment);
router.get('/income_expense' ,protect, printRequest  , checkActionAccess("income-expense","view") , getIncomeExpense);
router.get('/income_expense_summary' ,protect, printRequest  , checkActionAccess("income-expense","view") , getIncomeSummary);
router.get('/dashboard' ,protect, printRequest  , checkActionAccess("dashboard","view") , dashboard);
router.get('/today_dashboard' ,protect, printRequest  , checkActionAccess("dashboard","view") , todayDashboard);

module.exports = router;
