import React, { useState } from "react";
import { useForm } from "react-hook-form";
import useLoginStore from "../../store/useLoginStore";
import countries from "../../utils/countries";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import useThemeStore from "../../store/useThemeStore";
import useUserStore from "../../store/useUserStore";
import { motion } from "framer-motion";
import { FaWhatsapp, FaArrowLeft, FaSun, FaMoon } from "react-icons/fa";

// validation schema
const loginvalidationSchema = yup
  .object()
  .shape({
    phoneNumber: yup
      .string()
      .nullable()
      .notRequired()
      .matches(/^\d+$/, "phone number must be digits")
      .transform((value, originalValue) => {
        return originalValue.trim() === "" ? null : value;
      }),
    email: yup
      .string()
      .nullable()
      .notRequired()
      .email("please enter valid email")
      .transform((value, originalValue) => {
        return originalValue.trim() === "" ? null : value;
      }),
  })
  .test(
    "at-least-one",
    "either email or phone number is required",
    function (value) {
      return !!(value?.phoneNumber || value?.email);
    },
  );

const otpavalidationSchema = yup.object().shape({
  otp: yup
    .string()
    .length(6, "Otp must be exactly 6 digits")
    .required("Otp is required"),
});

const profileValidationSchema = yup.object().shape({
  username: yup.string().required("username is required"),
  agreed: yup.bool().oneOf([true], "You must agree to the terms"),
});

const avatars = [
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Mimi",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Jasper",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Zoe",
];

const Login = () => {
  const { step, setStep, setUserPhoneData, userPhoneData, resetLoginState } =
    useLoginStore();

  const [phoneNumber, setPhoneNuber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDropdown, setshowDropdown] = useState("");

  const navigate = useNavigate();

  // setUser is wired up below in onProfileSubmit once the real API call
  // is connected (see TODO there).
  const { setUser } = useUserStore();
  const { theme, setTheme } = useThemeStore();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm({
    resolver: yupResolver(loginvalidationSchema),
  });

  const {
    register: otpRegister,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    setValue: setOtpValue,
  } = useForm({
    resolver: yupResolver(otpavalidationSchema),
  });

  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: yupResolver(profileValidationSchema),
  });

  // ---- Step 1: phone / email submit ----
  const onLoginSubmit = async (data) => {
    setError("");
    setLoading(true);
    try {
      const payload = {
        phoneNumber: data.phoneNumber
          ? `${selectedCountry.dialCode}${data.phoneNumber}`
          : null,
        email: data.email || null,
      };

      // TODO: replace with real API call, e.g.
      // const res = await axiosInstance.post("/auth/send-otp", payload);

      setUserPhoneData(payload);
      setStep(2);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to send OTP. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ---- Step 2: OTP handling ----
  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return; // only allow a single digit
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpValue("otp", newOtp.join(""));

    // auto-focus next box
    if (value && index < 5) {
      const next = document.getElementById(`otp-input-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-input-${index - 1}`);
      prev?.focus();
    }
  };

  const onOtpSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      // TODO: replace with real API call, e.g.
      // const res = await axiosInstance.post("/auth/verify-otp", {
      //   ...userPhoneData,
      //   otp: otp.join(""),
      // });

      setStep(3);
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---- Step 3: profile setup ----
  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      setProfilePicture(URL.createObjectURL(file));
    }
  };

  const onProfileSubmit = async (data) => {
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", data.username);
      formData.append(
        "profilePicture",
        profilePictureFile ? profilePictureFile : selectedAvatar,
      );
      if (userPhoneData?.phoneNumber)
        formData.append("phoneNumber", userPhoneData.phoneNumber);
      if (userPhoneData?.email) formData.append("email", userPhoneData.email);

      // TODO: replace with real API call, e.g.
      // const res = await axiosInstance.post("/auth/complete-profile", formData);
      // setUser(res.data.user);

      resetLoginState();
      navigate("/");
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to create profile. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setError("");
    setStep(Math.max(1, step - 1));
  };

  const ProgressBar = () => (
    <div
      className={`w-full ${
        theme === "dark" ? "bg-gray-700" : "bg-gray-200"
      } rounded-full h-2.5 mb-6`}
    >
      <div
        className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-in-out"
        style={{ width: `${(step / 3) * 100}%` }}
      ></div>
    </div>
  );

  const inputClasses = `w-full px-4 py-3 rounded-lg border ${
    theme === "dark"
      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
      : "bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400"
  } focus:outline-none focus:ring-2 focus:ring-green-500 transition`;

  const renderStepOne = () => (
    <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
      <div>
        <label
          className={`block text-sm font-medium mb-2 ${
            theme === "dark" ? "text-gray-200" : "text-gray-700"
          }`}
        >
          Phone Number
        </label>
        {/* FIX: select gets flex-none + fixed width so it can't expand or
            shrink, and the input gets min-w-0 so flex-1 actually works.
            Without min-w-0, the input's implicit min-width: auto fights
            flex-1 and the input gets squeezed down to almost nothing. */}
        <div className="flex gap-2">
          <select
            value={selectedCountry.alpha2}
            onChange={(e) =>
              setSelectedCountry(
                countries.find((c) => c.alpha2 === e.target.value) ||
                  countries[0],
              )
            }
            className={`${inputClasses} w-32 flex-shrink-0`}
          >
            {countries.map((c) => (
              <option key={c.alpha2} value={c.alpha2}>
                {c.flag ? `${c.flag} ` : ""}
                {c.dialCode}
              </option>
            ))}
          </select>
          <input
            type="tel"
            placeholder="Enter phone number"
            value={phoneNumber}
            {...loginRegister("phoneNumber")}
            onChange={(e) => setPhoneNuber(e.target.value)}
            className={`${inputClasses} flex-1 min-w-0`}
          />
        </div>
        {loginErrors.phoneNumber && (
          <p className="text-red-500 text-sm mt-1">
            {loginErrors.phoneNumber.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`flex-1 h-px ${
            theme === "dark" ? "bg-gray-700" : "bg-gray-200"
          }`}
        />
        <span
          className={`text-xs uppercase ${
            theme === "dark" ? "text-gray-400" : "text-gray-400"
          }`}
        >
          or
        </span>
        <span
          className={`flex-1 h-px ${
            theme === "dark" ? "bg-gray-700" : "bg-gray-200"
          }`}
        />
      </div>

      <div>
        <label
          className={`block text-sm font-medium mb-2 ${
            theme === "dark" ? "text-gray-200" : "text-gray-700"
          }`}
        >
          Email
        </label>
        <input
          type="email"
          placeholder="Enter email address"
          value={email}
          {...loginRegister("email")}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClasses}
        />
        {loginErrors.email && (
          <p className="text-red-500 text-sm mt-1">
            {loginErrors.email.message}
          </p>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition"
      >
        {loading ? "Sending..." : "Send OTP"}
      </button>
    </form>
  );

  const renderStepTwo = () => (
    <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-6">
      <p
        className={`text-center text-sm ${
          theme === "dark" ? "text-gray-300" : "text-gray-600"
        }`}
      >
        Enter the 6-digit code sent to{" "}
        <span className="font-medium">
          {userPhoneData?.phoneNumber || userPhoneData?.email || "your device"}
        </span>
      </p>

      <input type="hidden" {...otpRegister("otp")} value={otp.join("")} />

      <div className="flex justify-center gap-2">
        {otp.map((digit, index) => (
          <input
            key={index}
            id={`otp-input-${index}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(e.target.value, index)}
            onKeyDown={(e) => handleOtpKeyDown(e, index)}
            className={`w-12 h-12 text-center text-lg font-semibold rounded-lg border ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-gray-50 border-gray-300 text-gray-800"
            } focus:outline-none focus:ring-2 focus:ring-green-500 transition`}
          />
        ))}
      </div>
      {otpErrors.otp && (
        <p className="text-red-500 text-sm text-center">
          {otpErrors.otp.message}
        </p>
      )}

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <p
        className={`text-center text-sm ${
          theme === "dark" ? "text-gray-400" : "text-gray-500"
        }`}
      >
        Wrong number?{" "}
        <button
          type="button"
          onClick={goBack}
          className="text-green-500 font-semibold hover:underline"
        >
          Change Number
        </button>
      </p>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition"
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>
    </form>
  );

  const renderStepThree = () => (
    <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
      <div className="flex flex-col items-center gap-3">
        <img
          src={profilePicture || selectedAvatar}
          alt="profile preview"
          className="w-24 h-24 rounded-full object-cover border-4 border-green-500"
        />
        <label
          className={`text-sm cursor-pointer font-medium ${
            theme === "dark" ? "text-green-400" : "text-green-600"
          }`}
        >
          Upload your own photo
          <input
            type="file"
            accept="image/*"
            onChange={handleProfilePictureChange}
            className="hidden"
          />
        </label>

        <div className="flex gap-2 flex-wrap justify-center">
          {avatars.map((avatar) => (
            <button
              type="button"
              key={avatar}
              onClick={() => {
                setSelectedAvatar(avatar);
                setProfilePicture(null);
                setProfilePictureFile(null);
              }}
              className={`rounded-full ring-2 transition ${
                selectedAvatar === avatar && !profilePicture
                  ? "ring-green-500"
                  : "ring-transparent"
              }`}
            >
              <img src={avatar} alt="avatar option" className="w-10 h-10" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          className={`block text-sm font-medium mb-2 ${
            theme === "dark" ? "text-gray-200" : "text-gray-700"
          }`}
        >
          Username
        </label>
        <input
          type="text"
          placeholder="Choose a username"
          {...profileRegister("username")}
          className={inputClasses}
        />
        {profileErrors.username && (
          <p className="text-red-500 text-sm mt-1">
            {profileErrors.username.message}
          </p>
        )}
      </div>

      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="agreed"
          {...profileRegister("agreed")}
          className="mt-1"
        />
        <label
          htmlFor="agreed"
          className={`text-sm ${
            theme === "dark" ? "text-gray-300" : "text-gray-600"
          }`}
        >
          I agree to the Terms of Service and Privacy Policy
        </label>
      </div>
      {profileErrors.agreed && (
        <p className="text-red-500 text-sm">{profileErrors.agreed.message}</p>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition"
      >
        {loading ? "Creating..." : "Create Profile"}
      </button>
    </form>
  );

  return (
    <div
      className={`min-h-screen ${
        theme === "dark"
          ? "bg-gray-900"
          : "bg-gradient-to-br from-green-400 to-blue-500"
      } flex items-center justify-center p-4 overflow-hidden relative`}
    >
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className={`absolute top-4 right-4 p-2 rounded-full transition ${
          theme === "dark"
            ? "bg-gray-800 text-yellow-300 hover:bg-gray-700"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
      >
        {theme === "dark" ? (
          <FaSun className="w-5 h-5" />
        ) : (
          <FaMoon className="w-5 h-5" />
        )}
      </button>

      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`${
          theme === "dark" ? "bg-gray-800 text-white" : "bg-white"
        } p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md relative`}
      >
        {step > 1 && (
          <button
            type="button"
            onClick={goBack}
            className={`absolute top-6 left-6 ${
              theme === "dark"
                ? "text-gray-300 hover:text-white"
                : "text-gray-500 hover:text-gray-800"
            } transition`}
            aria-label="Go back"
          >
            <FaArrowLeft className="w-5 h-5" />
          </button>
        )}

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.2,
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          className="w-24 h-24 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center"
        >
          <FaWhatsapp className="w-16 h-16 text-white" />
        </motion.div>

        <h1
          className={`text-3xl font-bold text-center mb-2 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          flashchat login
        </h1>
        <p
          className={`text-center text-sm mb-6 ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {step === 1 && "Sign in with your phone or email"}
          {step === 2 && "Verify your identity"}
          {step === 3 && "Set up your profile"}
        </p>

        <ProgressBar />

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {step === 1 && renderStepOne()}
          {step === 2 && renderStepTwo()}
          {step === 3 && renderStepThree()}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
