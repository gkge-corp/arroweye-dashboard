"use client";

import Image from "next/image";
import { Info, RotateCcw } from "lucide-react";
import { useLogin } from "@/hooks/use-login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const Login = () => {
  const {
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
  } = useLogin();

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#1c1611] px-5 py-8 font-SansFlex text-white">
      {randomBgImage && (
        <Image
          src={randomBgImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className={`absolute inset-0 size-full object-cover transition-[filter] duration-500 ${
            isBlurred ? "blur-[10px]" : "blur-none"
          }`}
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.08)_46%,rgba(0,0,0,0.22)_100%),linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.2)_100%)]" />
      <div className="relative z-10 w-full max-w-6xl">
        <div className="grid min-h-[min(680px,calc(100svh-4rem))] place-items-center gap-10 lg:flex lg:items-center lg:justify-between">
          <Image
            src="/aestudio.svg"
            alt="Arroweye Studio"
            width={238}
            height={79}
            priority
            className="h-auto w-[238px] drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] sm:w-[260px] lg:w-[238px]"
          />
          <section className="w-full max-w-[450px] overflow-hidden rounded-[10px] bg-white pb-[66px] text-[#111111] shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
            <div className="bg-[#287BE5] px-[32px] py-[28px] text-white">
              <div className="flex items-center gap-[18px]">
                <Info
                  size={24}
                  strokeWidth={2.5}
                  className="shrink-0 text-white"
                />
                <p className="text-[16px] font-normal leading-none text-white">
                  Please verify your credentials
                </p>
              </div>
            </div>

            <div className="mx-auto w-full px-[32px]">
              {!isOtpSent ? (
                <form
                  className="mt-8.5 w-full space-y-[38px]"
                  onSubmit={handleLoginSubmit}
                >
                  <Input
                    rounded={true}
                    type="email"
                    name="email"
                    placeholder="hi@arroweye.pro"
                    value={loginFormData.email}
                    onChange={handleLoginInputChange}
                    error={loginErrors.email}
                    className="h-[62px] w-full border-[#111111] bg-white text-center text-[16px] font-bold text-[#111111] shadow-none outline-none placeholder:text-[#A9AFBA] placeholder:opacity-100 focus:border-[#111111] focus:ring-0 dark:border-[#111111] dark:bg-white dark:text-[#111111]"
                  />
                  <div className="flex items-center justify-between gap-5">
                    <label className="flex items-center gap-[14px] text-[16px] font-medium text-[#6E6E73]">
                      <Switch
                        checked={storeCred}
                        onCheckedChange={setStoreCred}
                        className="h-[34px] w-[61px] border-0"
                      />
                      Store Credentials
                    </label>
                    <Button
                      disabled={isLoginLoading}
                      size="lg"
                      className="h-[54px] rounded-full bg-black px-[30px] text-[16px] font-bold leading-none text-white hover:bg-black/85 disabled:bg-black disabled:text-white disabled:opacity-60"
                    >
                      {isLoginLoading ? "Sending" : "Send OTP"}
                    </Button>
                  </div>
                </form>
              ) : (
                <form
                  className="mt-[34px] w-full space-y-[38px]"
                  onSubmit={handleOtpSubmit}
                >
                  <Input
                    rounded={true}
                    type="text"
                    name="otp"
                    placeholder="Enter OTP"
                    value={otpFormData.otp}
                    onChange={handleOtpInputChange}
                    error={otpErrors.otp}
                    className="h-[62px] w-full border-[#111111] bg-white text-center text-[16px] font-bold text-[#111111] shadow-none outline-none placeholder:text-[#A9AFBA] placeholder:opacity-100 focus:border-[#111111] focus:ring-0 dark:border-[#111111] dark:bg-white dark:text-[#111111]"
                  />

                  <div className="flex items-center justify-between gap-4">
                    <button
                      type="button"
                      className="flex items-center gap-[6px] text-[16px] font-medium text-[#287BE5] transition-colors hover:text-[#1768ce]"
                      onClick={() => setIsOtpSent(false)}
                    >
                      <RotateCcw size={16} strokeWidth={2} />
                      Resend OTP
                    </button>
                    <Button
                      disabled={isOtpLoading}
                      size="lg"
                      className="h-[54px] rounded-full bg-black px-[30px] text-[16px] font-bold leading-none text-white hover:bg-black/85 disabled:bg-black disabled:text-white disabled:opacity-60"
                    >
                      {isOtpLoading ? "Verifying" : "Verify OTP"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Login;
