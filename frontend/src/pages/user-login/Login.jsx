import React from 'react';
import useLoginStore from'../../store/useLoginStore';
import countries from '../../utils/countriles';
import * as yup from 'yup';
import {yupResolver} from "@hookfrom/resolvers/yup";


// validation schema
const loginvalidationSchema =yup
.objact()
.shape({
    phoneNumber:yup.string().nullable().notRequired().match(/^\d+$/,"phome number be digit").transform((value,originalValue)=>{
        originalValue.trim()==="" ?null :value
    }),
    email:yup.string().nullable().notRequired().email("please enter valid email").transform((value,originalValue)=>{
        originalValue.trim()==="" ?null :value
    })
})

const Login = () => {
    const{step,setStep,setUserPhoneData,userPhoneData,resetLoginState} =useLoginStore();
    const [phoneNumber,setPhoneNuber] =usestate("");
    const[selectedCountry,setSelectedCountry] =useState(countries[0]);
    const[otp,setOtp] =useState(["", "" ,"" ,"" ,"" ,"" ])
    const [email,setEmail] =useState("")

      return (
    <div>
      Login
    </div>
  )
}

export default Login
