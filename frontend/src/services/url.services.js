import axios from axios;

const apiUrl =`${process.env.REACT_APP_API_URL}API`;

const axiosInstance =axios.create({
    baseUrl:apiUrl,
    withcredentials:true
})

export default axiosInstance;