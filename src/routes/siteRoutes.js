const { addSite, getAllSites, updateSite, deleteSite, getSitesByClient, getSitesWithMaterialByClient } = require("../controllers/siteController");
const { protect, checkActionAccess } = require("../middlewares/protect");
const { printRequest } = require("../logger")("Vehicle_CONTROLLER");

const router = require("express").Router();

router.post("/add_site" ,protect,printRequest,checkActionAccess("sites","create"), addSite);
router.get('/all_sites' ,protect, printRequest  , checkActionAccess("sites","view") , getAllSites);
router.get('/clients_sites_materials/:id' ,protect, printRequest  , checkActionAccess("sites","view") , getSitesWithMaterialByClient);
router.get('/clients_sites/:id' ,protect, printRequest  , checkActionAccess("sites","view") , getSitesByClient);
router.route('/:id')
    .put(printRequest , protect , checkActionAccess("sites","update"),updateSite )
    .delete(printRequest , protect , checkActionAccess("sites","delete"), deleteSite )
module.exports = router;
