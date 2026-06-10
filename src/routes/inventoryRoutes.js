const router = require("express").Router();
const menus = require("../constants/menus.constants");
const {
    createInventory,
    getAllInventories,
    getSingle,
    update,
    deleteInventory,
    createCSVUploadOfInventory
} = require("../controllers/inventoryController");
const { printRequest } = require("../logger")("INVENTORY_CONTROLLER");
const { protect , checkAccess } = require('../middlewares/protect');



router.route('/')
    .post(
        printRequest ,
        protect , 
        checkAccess(menus.inventories) ,
        createInventory
    )
    .get(printRequest , protect , getAllInventories )

router.post('/upload-by-csv' , printRequest , protect , createCSVUploadOfInventory)

router.route('/:id')
    .get(printRequest , getSingle)
    .put(
        printRequest ,
        protect , 
        checkAccess(menus.inventories) ,
        update
    )
    .delete(printRequest , protect , checkAccess(menus.inventories) , deleteInventory)

module.exports = router;
