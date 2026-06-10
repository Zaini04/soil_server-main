const { addVehicle, getAllVehiles, updateVehicle, deleteVehicle } = require("../controllers/vehicleController");
const { protect, checkActionAccess } = require("../middlewares/protect");
const { printRequest } = require("../logger")("Vehicle_CONTROLLER");

const router = require("express").Router();

router.post("/add_vehicle" ,protect,printRequest,checkActionAccess("vehicles","create"), addVehicle);
router.get('/all_vehicles' ,protect, printRequest  , checkActionAccess("vehicles","view") , getAllVehiles);
router.route('/:id')
    .put(printRequest , protect , checkActionAccess("vehicles","update"),updateVehicle )
    .delete(printRequest , protect , checkActionAccess("vehicles","delete"), deleteVehicle )
module.exports = router;
