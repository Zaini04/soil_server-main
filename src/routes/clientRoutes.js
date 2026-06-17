const { addClient, getAllClients, updateClient, deleteClient, getClientDropdownList, getClientSummary } = require("../controllers/clientController");
const { getEntriesByClient } = require("../controllers/entryVehicleController");
const { protect, checkActionAccess } = require("../middlewares/protect");
const { printRequest } = require("../logger")("Client_CONTROLLER");

const router = require("express").Router();

router.post("/add_client" ,protect,printRequest,checkActionAccess("clients","create"), addClient);
router.get('/all_clients' ,protect, printRequest  , checkActionAccess("clients","view") , getAllClients);
router.get('/clients_list' ,protect, printRequest  , checkActionAccess("clients","view") , getClientDropdownList);
router.get('/ledger/:id' ,protect, printRequest  , checkActionAccess("clients","view") , getEntriesByClient);
router.get("/client_summary/:id",protect, printRequest  , checkActionAccess("clients","view"), getClientSummary);
router.route('/:id')
    .put(printRequest , protect , checkActionAccess("clients","update"),updateClient )
    .delete(printRequest , protect , checkActionAccess("clients","delete"), deleteClient )

module.exports = router;
