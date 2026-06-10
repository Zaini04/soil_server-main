const { addSite, getAllSites, getSiteMaterials, updateSite, deleteSite } = require("../controllers/siteController");
const { addVehicle, getAllVehiles, updateVehicle, deleteVehicle } = require("../controllers/vehicleController");
const { protect, checkActionAccess } = require("../middlewares/protect");
const { printRequest } = require("../logger")("Vehicle_CONTROLLER");

const router = require("express").Router();

router.post("/add_site" ,protect,printRequest,checkActionAccess("sites","create"), addSite);
router.get('/all_sites' ,protect, printRequest  , checkActionAccess("sites","view") , getAllSites);
router.get('/all_clients_sites' ,protect, printRequest  , checkActionAccess("sites","view") , getSiteMaterials);
router.route('/:id')
    .put(printRequest , protect , checkActionAccess("sites","update"),updateSite )
    .delete(printRequest , protect , checkActionAccess("sites","delete"), deleteSite )
module.exports = router;
