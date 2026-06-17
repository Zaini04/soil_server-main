const { addFuelCompany, getAllFuelCompanies, updateFuelCompany, deleteFuelCompany } = require("../controllers/fuelCompanyController");
const { addFuelRecord, getAllFuelRecords, updateFuelRecord, deleteFuelRecord, addFuelStock, getAllFuelStock, updateFuelStock, deleteFuelStock, getAllFuelStockCompanies, getAllFuelCompaniesWithStock, getEntryFuels } = require("../controllers/fuelController");
const { protect, checkActionAccess } = require("../middlewares/protect");
const { printRequest } = require("../logger")("Vehicle_CONTROLLER");

const router = require("express").Router();

router.post("/add_fuel_stock" ,protect,printRequest,checkActionAccess("fuel-stock","create"), addFuelStock);
router.get('/all_fuel_stocks' ,protect, printRequest  , checkActionAccess("fuel-stock","view") , getAllFuelStock);

router.route('/:id')
    .put(printRequest , protect , checkActionAccess("fuel-stock","update"),updateFuelStock )
    .delete(printRequest , protect , checkActionAccess("fuel-stock","delete"), deleteFuelStock )


    router.post("/add_fuel_company" ,protect,printRequest,checkActionAccess("fuel-stock","create"), addFuelCompany);
router.get('/all_fuel_companies' ,protect, printRequest  , checkActionAccess("fuel-stock","view") , getAllFuelCompanies);
router.get('/all_fuel_companies_list' ,protect, printRequest  , checkActionAccess("fuel-stock","view") , getAllFuelStockCompanies);
router.get('/all_fuel_stock_companies_list' ,protect, printRequest  , checkActionAccess("fuel-stock","view") , getAllFuelCompaniesWithStock);
router.get('/entry_fuels' ,protect, printRequest  , checkActionAccess("fuel-stock","view") , getEntryFuels);

router.route('/company/:id')
    .put(printRequest , protect , checkActionAccess("fuel-stock","update"),updateFuelCompany )
    .delete(printRequest , protect , checkActionAccess("fuel-stock","delete"), deleteFuelCompany )
module.exports = router;
