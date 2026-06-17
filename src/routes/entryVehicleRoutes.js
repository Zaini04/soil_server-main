const { entryVehicle, getAllEntryVehicles, updateEntryVehicle, deleteEntryVehicle, getEntriesByVehicle, getEntriesByClient, generateBill, recordPayment } = require("../controllers/entryVehicleController");
const { protect, checkActionAccess } = require("../middlewares/protect");
const { printRequest } = require("../logger")("Vehicle_CONTROLLER");

const router = require("express").Router();

router.post("/entry" ,protect,printRequest,checkActionAccess("entry-vehicle","create"), entryVehicle);
router.get('/all_entry_vehicles' ,protect, printRequest  , checkActionAccess("entry-vehicle","view") , getAllEntryVehicles);
router.post('/generate_bill/:id' ,protect, printRequest  , checkActionAccess("entry-vehicle","view") , generateBill);
router.post('/payment/:id' ,protect, printRequest  , checkActionAccess("entry-vehicle","view") , recordPayment);

module.exports = router;
