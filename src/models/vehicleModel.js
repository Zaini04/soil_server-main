const   mongoose  = require("mongoose");
const { type } = require("../validations/userValidations");

const VehicleSchema = new mongoose.Schema({
    vehicleNo : {
        type:String,
        unique : true , 
        required:[true,"Vehicle no is required"]
    },
    ownerName :{
         type:String,
        required:[true,"Owner name is required "]

    },
    typeVehicle :{
         type:String,
        required:[true,"Vehicle type is required "]

    },
    status :{
         type:String,
        enum:['Active','Inactive','Blocked',"Deleted"],
        required:[true,"Vehicle status is required "]
    }
},{timestamps:true})

const Vehicle = mongoose.model('Vehicle' , VehicleSchema);
module.exports = Vehicle;