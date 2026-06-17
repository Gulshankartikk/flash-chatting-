import axiosInstance from "./url.services";




export const sendOtp =async(phonenumber,phoneSuffix,email)=>{
    try {
        const response = await axiosInstance.post('/auth/send-otp',{phonenumber,phoneSuffix,email});
        return response.data;
    } catch (error){
        throw error.response ?error.response.data : error.message;
    }
}


export const verifyOtp =async(phonenumber,phoneSuffix,otp,email)=>{
    try {
        const response = await axiosInstance.post('/auth/verify-otp',{phonenumber,phoneSuffix,otp,email});
        return response.data;
    } catch (error){
        throw error.response ?error.response.data : error.message;
    }
}

export const updateUserProfile = async(updateData) => {
    try {
        const response = await axiosInstance.put('/auth/update-profile',updateData);
        return response.data;
    } catch (error){
        throw error.response ?error.response.data : error.message;
    }
}


export const checkUserAuth = async() => {
    try {
        const response = await axiosInstance.get('/auth/check-auth');
        if(response.data.status ==='success'){
            return{isAuthenticated:true,user:response?.data?.data}
        }else if(response.data.status ==="error"){
            return{isAuthenticated:false}
        }
    } catch (error){
        throw error.response ?error.response.data : error.message;
    }
}


export const logoutUser = async() => {
    try {
        const response = await axiosInstance.get('/auth/logout',);
        return response.data;
    } catch (error){
        throw error.response ?error.response.data : error.message;
    }
}

export const getAllUser = async() => {
    try {
        const response = await axiosInstance.get('/auth/user');
        return response.data;
    } catch (error){
        throw error.response ?error.response.data : error.message;
    }
}