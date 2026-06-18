const sendCookie = (res , token) => {
    let cookieOptions =  {
        expires : new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly : true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        secure: process.env.NODE_ENV === "production",
    }
    res.cookie('token' , token  , cookieOptions);
}

module.exports = sendCookie;