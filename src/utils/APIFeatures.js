class APIFeatures {
    constructor(query , queryStr){
        this.query = query;
        this.queryStr = queryStr;
    }

    filter() {
        let queryObj = { ...this.queryStr };
        const excludeFields = ['sort', 'limit', 'page', 'fields','clientName','searchdate'];
        excludeFields.forEach((el) => delete queryObj[el]);
    
        let queryStr = {};
    
        // Handle other conditions 
        if(queryObj.fuelLiters){
            queryStr.fuelLiters = queryObj.fuelLiters
        }
         if (queryObj.vehicle) {
    queryStr.vehicle = queryObj.vehicle;
  }
         if (queryObj.client) {
    queryStr.client = queryObj.client;
  }

 
        if(queryObj.fuelCompany){
            queryStr.fuelCompany = queryObj.fuelCompany
        }
        if (queryObj.status) {
            queryStr.status = queryObj.status;
        }
        if(queryObj.ownerName){
            queryStr.ownerName = queryObj.ownerName
        }
        if(queryObj.vehicleNo){
            queryStr.vehicleNo=queryObj.vehicleNo
        }
        
        if(queryObj.name){
            queryStr.name = queryObj.name
        }
        if(queryObj.siteName){
            queryStr.siteName = queryObj.siteName
        }
        if (queryObj.autoIncrementId !== undefined) {
            queryStr.autoIncrementId = queryObj.autoIncrementId;
        }

 // --- HANDLE DATE RANGE ---
if (queryObj.from || queryObj.to) {
    queryStr.createdAt = {};
    
    if (queryObj.from) {
        const startDate = new Date(queryObj.from);
        startDate.setUTCHours(0, 0, 0, 0);
        queryStr.createdAt.$gte = startDate;
    }
    
    if (queryObj.to) {
        const endDate = new Date(queryObj.to);
        endDate.setUTCHours(23, 59, 59, 999);
        queryStr.createdAt.$lte = endDate;
    }
}else if (queryObj.date) {
    // Agar koi single date bheje (Puranay flow k liye fallback)
    const startOfDay = new Date(queryObj.date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(queryObj.date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    queryStr.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay
    };
}
    
        if (queryObj.keyword) {
            const keywordQuery = {
                $or: [
                    { name: { $regex: queryObj.keyword , $options: 'i' } },
                    { title: { $regex: queryObj.keyword , $options: 'i' } },
                    { username : { $regex: queryObj.keyword , $options: 'i' } },
                    { email : { $regex: queryObj.keyword , $options: 'i' } },
                    { cnic : { $regex: queryObj.keyword , $options: 'i' } },
                    { phone : { $regex: queryObj.keyword , $options: 'i' } },
                    { phoneNumber : { $regex: queryObj.keyword , $options: 'i' } },
                    { phoneNumber2 : { $regex: queryObj.keyword , $options: 'i' } },
                    { whatsappNumber : { $regex: queryObj.keyword , $options: 'i' } },
                    { whatsappNumber2 : { $regex: queryObj.keyword , $options: 'i' } },
                    { city : { $regex: queryObj.keyword , $options: 'i' } },
                    { province : { $regex: queryObj.keyword , $options: 'i' } },
                    { number : { $regex: queryObj.keyword , $options: 'i' } },
                    { fullNumber : { $regex: queryObj.keyword , $options: 'i' } },
                ],
            };
            queryStr = { ...queryStr, ...keywordQuery };
        }
    
    
        this.query = this.query.find(queryStr);
        this.queryObj = { ...queryStr };
        return this;
    }

    sort() {
        if (this.queryStr.sort) {
            const [field, order] = this.queryStr.sort.split(':');
            const sortOrder = order === 'asc' ? 1 : -1;
            this.query = this.query.sort({ [field]: sortOrder });
        } else if (this.queryStr.sortBy) {
            const [field, order] = this.queryStr.sortBy.split('_');
            const sortOrder = order === 'ascending' || order === 'asc' ? 1 : -1;
            this.query = this.query.sort({ [field]: sortOrder });
        } else {
            this.query = this.query.sort({ createdAt: -1 });
        }
        return this;
    }

    limitFields () {
        if(this.queryStr.fields){
            let fields = this.queryStr.fields.split(",").join(" ");
            this.query = this.query.select(fields)
        }else{
            this.query = this.query.select('-__v -password')
        }
        return this;
    }

    paginate () {
        const page = this.queryStr.page * 1 || 1;
        const pageSize  = this.queryStr.pageSize * 1 || 10;
        const skip = (page - 1) * pageSize;
        this.query.skip(skip).limit(pageSize)
        this.pageSize = pageSize;
        this.page = page;
        return this;
    }

}

module.exports = APIFeatures;
