import React from "react";
import useLoginStore from "../../store/useLoginStore";
import countries from "../../utils/countriles";
import * as yup from "yup";
import { yupResolver } from "@hookfrom/resolvers/yup";
import { useNavigation } from "react-router-dom";
import userThemeStore from "../../store/themeStore";

// validation schema
const loginvalidationSchema = yup
  .objact()
  .shape({
    phoneNumber: yup
      .string()
      .nullable()
      .notRequired()
      .match(/^\d+$/, "phome number be digit")
      .transform((value, originalValue) => {
        originalValue.trim() === "" ? null : value;
      }),
    email: yup
      .string()
      .nullable()
      .notRequired()
      .email("please enter valid email")
      .transform((value, originalValue) => {
        originalValue.trim() === "" ? null : value;
      }),
  })
  .test(
    "at-least-one",
    "either email or phone number is required",
    function (value) {
      return !!(value.phoneNumber || value.email);
    },
  );

  const otpavalidationSchema =yup.object().shape({
    otp:yup.string().length(6.,"Otp must be  excatly required ").required("Otp is required")
  });

  const profileValidationSchema =yup.object().shape({
    username:yup.string().required("username is requred"),
    agreed:yup.bool().oneOf([true],"You must agree to the terms")
  });

   const avatars = [
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Mimi',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Jasper',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Zoe',
]

const Login = () => {
  const { step, setStep, setUserPhoneData, userPhoneData, resetLoginState } =
    useLoginStore();
  const [phoneNumber, setPhoneNuber] = usestate("");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [profilePicture,setProfilePicture] = useState(null);
  const [selectedAvatar,setSelectedAvatar] = useState(avatars[0]);
  const [profilePictureFile,setProfilePictureFile] =useState(null);
  const [error,setError] =useState("");
  const navigate = useNavigation();
  const {setUser} =useUserStore();
  const {theme,setTheme} =useThemeStore();

  const {
    register:loginRegister,
    handleSubmit:handleLoginSubmit,
    formState:{error:loginerrors}
  } =useForm({
    resolver:yupResolver(loginvalidationSchema)
  })


  
  const {
    register:handleOtpSubmit,
    formState:{error:otpErrors},
    setValue:setOtpValue
  } =useForm({
    resolver:yupResolver(loginvalidationSchema)
  })

  const {
    register:profileRegister,
    handleSubmit:handleProfileSubmit,
    formState:{error:ProfileErrors},
    watch
  } =useForm({
    resolver:yupResolver(loginvalidationSchema)
  })
  

  return <div>Login</div>;
};

export default Login;
