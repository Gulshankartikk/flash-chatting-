 import {create } from "zustand";
import {persist } from "zustand/middleware";

const userloginStore =create(
    persist(
        (set)=> ({
            step:1,
            usePhoneData:null,
            setStep:(step)=>set({step}),
            setUserPhoneData: (data)=>({usePhoneData:data}),
            resetLoginState:()=>set({step:1,usePhoneData:null}),
        }),
        {
            name:"login-storage",
            partialize:(state)=>({
                step:state.step,
                setUserPhoneData:state.usePhoneData,
            }),
        }
    )
);

export default userloginStore