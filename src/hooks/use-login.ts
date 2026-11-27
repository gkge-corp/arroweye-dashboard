import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/auth-session";
import { LoginEP, VerifyLogin } from "../services";

const bgImages = [
  "/assets/image%20(1).webp",
  "/assets/image%20(2).webp",
  "/assets/image%20(3).webp",
  "/assets/image%20(4).webp",
  "/assets/image%20(5).webp",
  "/assets/image%20(6).webp",
  "/assets/image%20(7).webp",
  "/assets/image%20(9).webp",
  "/assets/image%20(13).webp",
  "/assets/image%20(14).webp",
];

const getDeterministicBgImage = () => {
  const day = new Date().getUTCDate();
  return bgImages[day % bgImages.length];
};

interface UseLoginProps {
  toastRef?: unknown;
}

export const useLogin = (_props?: UseLoginProps) => {
  const { login } = useAuth();

  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [storeCred, setStoreCred] = useState(false);

  const [randomBgImage] = useState(getDeterministicBgImage());
  const [isBlurred, setIsBlurred] = useState(true);

  const [loginFormData, setLoginFormData] = useState({
    email: "",
  });

  const [otpFormData, setOtpLoginFormData] = useState({
    otp: "",
  });

  const [loginErrors, setLoginErrors] = useState({
    email: "",
  });

  const [otpErrors, setOtpErrors] = useState({
    otp: "",
  });

  const [isOtpSent, setIsOtpSent] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem("storedEmail");
    if (storedEmail) {
      setLoginFormData((prevData) => ({ ...prevData, email: storedEmail }));
      setStoreCred(true);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBlurred(false);
    }, 7000);

    return () => clearTimeout(timer);
  }, []);

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOtpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOtpLoginFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (storeCred) {
      localStorage.setItem("storedEmail", loginFormData.email);
    } else {
      localStorage.removeItem("storedEmail");
    }

    setIsLoginLoading(true);

    const newLoginErrors = {
      email: "",
    };

    if (
      !loginFormData.email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginFormData.email)
    ) {
      newLoginErrors.email = "Please enter a valid email address.";
    }

    if (newLoginErrors.email !== "") {
      setLoginErrors(newLoginErrors);
      toast.error(newLoginErrors.email);
      setIsLoginLoading(false);
      return;
    }

    LoginEP(loginFormData)
      .then((response) => {
        if (!response?.errorResponse) {
          setIsOtpSent(true);
          toast.success(response?.message || "OTP sent successfully.");
        } else {
          toast.error(response?.message || "Login failed.");
        }
      })
      .catch((err) => {
        console.error("Error submitting form:", err.message || err);
        toast.error("Unable to send OTP. Please try again.");
      })
      .finally(() => {
        setIsLoginLoading(false);
      });
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOtpLoading(true);

    const newLoginErrors = {
      otp: "",
    };

    if (!otpFormData.otp || !/^\d{6}$/.test(otpFormData.otp)) {
      newLoginErrors.otp = "Please enter a valid OTP with exactly 6 digits.";
    }

    setOtpErrors(newLoginErrors);

    if (newLoginErrors.otp === "") {
      VerifyLogin({ email: loginFormData.email, token: otpFormData.otp })
        .then((response) => {
          toast.success("Verification successful!");
          login(response);
        })
        .catch((err) => {
          console.error("Error verifying OTP:", err);
          toast.error("Failed to verify OTP. Please try again.");
        })
        .finally(() => {
          setIsOtpLoading(false);
        });
    } else {
      toast.error(newLoginErrors.otp);
      setIsOtpLoading(false);
    }
  };

  return {
    isLoginLoading,
    isOtpLoading,
    storeCred,
    setStoreCred,
    randomBgImage,
    isBlurred,
    loginFormData,
    otpFormData,
    loginErrors,
    otpErrors,
    isOtpSent,
    setIsOtpSent,
    handleLoginInputChange,
    handleOtpInputChange,
    handleLoginSubmit,
    handleOtpSubmit,
  };
};
