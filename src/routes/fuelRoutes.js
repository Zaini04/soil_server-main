const { addFuelRecord, getAllFuelRecords, updateFuelRecord, deleteFuelRecord } = require("../controllers/fuelController");
const { protect, checkActionAccess } = require("../middlewares/protect");
const { printRequest } = require("../logger")("Vehicle_CONTROLLER");

const router = require("express").Router();

router.post("/add_fuel_company" ,protect,printRequest,checkActionAccess("fuel-company","create"), addFuelRecord);
router.get('/all_fuel-companies' ,protect, printRequest  , checkActionAccess("fuel-company","view") , getAllFuelRecords);
router.route('/:id')
    .put(printRequest , protect , checkActionAccess("fuel-company","update"),updateFuelRecord )
    .delete(printRequest , protect , checkActionAccess("fuel-company","delete"), deleteFuelRecord )
module.exports = router;
