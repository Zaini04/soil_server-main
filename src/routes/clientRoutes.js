const { addClient, getAllClients, updateClient, deleteClient, getClientDropdownList } = require("../controllers/clientController");
const { protect, checkActionAccess } = require("../middlewares/protect");
const { printRequest } = require("../logger")("Client_CONTROLLER");

const router = require("express").Router();

router.post("/add_client" ,protect,printRequest,checkActionAccess("clients","create"), addClient);
router.get('/all_clients' ,protect, printRequest  , checkActionAccess("clients","view") , getAllClients);
router.get('/clients_list' ,protect, printRequest  , checkActionAccess("clients","view") , getClientDropdownList);

router.route('/:id')
    .put(printRequest , protect , checkActionAccess("clients","update"),updateClient )
    .delete(printRequest , protect , checkActionAccess("clients","delete"), deleteClient )

module.exports = router;
