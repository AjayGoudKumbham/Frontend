import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import Input from "../components/shared/Input";
import Button from "../components/shared/Button";
import toast from "react-hot-toast";
import { validateEmail } from "../utils/validation";
import axios from "axios";  // Make sure to import axios for API requests

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    otp: "", // Added OTP field
  });
  const [errors, setErrors] = useState({
    email: "",
    otp: "", // Added OTP error
  });
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false); // Track OTP sent status

  // Validate form fields
  const validateForm = (): boolean => {
    const newErrors = {
      email: validateEmail(formData.email) || "",
      otp: otpSent && !formData.otp ? "OTP is required" : "", // OTP validation
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  // Handle OTP generation
  const handleGenerateOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Send the OTP request to the backend
      await axios.post("http://localhost:8080/api/auth/login/send-otp", {
        email: formData.email,
      });

      toast.success("OTP sent successfully to your email");

      // Mark OTP as sent
      setOtpSent(true);
    } catch (error: any) {
      toast.error("Failed to generate OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP validation
  const handleValidateOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Send the OTP verification request to backend
      const response = await axios.post("http://localhost:8080/api/auth/login/verify-otp", {
        email: formData.email,
        otp: formData.otp,
      });

      // Extract the token from response and store it in localStorage
      const { token } = response.data;
      localStorage.setItem("token", token);  // Store token in localStorage

      console.log("Token:", token);  // You can store this token for further use

      // Navigate to the welcome page after successful validation
      navigate("/profile-setup");
    } catch (error: any) {
      toast.error("Invalid OTP. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            icon={ArrowLeft}
            onClick={() => navigate("/")}
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {otpSent ? "OTP Validation" : "Login"}
            </h1>
            <p className="mt-1 text-gray-600">
              {otpSent
                ? "Enter the OTP sent to your email."
                : "Enter your email to receive an OTP"}
            </p>
          </div>
        </div>

        <form
          onSubmit={otpSent ? handleValidateOTP : handleGenerateOTP}
          className="space-y-4"
        >
          <Input
            icon={Mail}
            label="Email ID"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            required
            disabled={otpSent} // Disable Email input after OTP is sent
          />

          {otpSent && (
            <Input
              icon={Mail}
              label="OTP"
              type="text"
              placeholder="Enter OTP"
              value={formData.otp}
              onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
              error={errors.otp}
              required
            />
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending OTP..." : otpSent ? "Validate OTP" : "Generate OTP"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
