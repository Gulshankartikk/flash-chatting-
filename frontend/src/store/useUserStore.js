import {create } from "zustand";
import {persist } from "zustand/middleware";

const userUserStore =create(
    persist(
        (set)=> ({
            user:null,
            isAuthenticated:false,
            setUser:(userData)=>set({userData,isAuthenticated:true}),
            clearUser:()=>set({user:null, isAuthenticated:false}),
        }),
        {
            name:"login-storage",
            getStorage: ()=>localStorage
        }
    )
);

export default userUserStore