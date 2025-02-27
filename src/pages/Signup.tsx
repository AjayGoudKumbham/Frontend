import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { UserPlus } from "lucide-react";

interface FormData {
  fullName: string;
  dob: string;
  email: string;
  contact: string;
}

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    dob: "",
    email: "",
    contact: "",
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false); // To track OTP sent status
  const [otp, setOtp] = useState(""); // To store the OTP entered by the user
  const [otpError, setOtpError] = useState(""); // For OTP validation errors
  const [timer, setTimer] = useState(60); // Timer for OTP expiration

  // Predefined error messages
  const errorMessages: { [key: string]: string } = {
    fullName: "Please enter a valid full name.",
    dob: "Please enter a valid date of birth.",
    email: "Please enter a valid email address.",
    contact: "Please enter a valid mobile number.",
    otp: "Please enter the OTP sent to your email."
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    let isValid = true;

    if (!formData.fullName.trim()) {
      newErrors.fullName = errorMessages.fullName;
      isValid = false;
    } else if (!/^[a-zA-Z\s]{3,50}$/.test(formData.fullName.trim())) {
      newErrors.fullName = "Name must be at least 3 characters long (letters and spaces only).";
      isValid = false;
    }

    if (!formData.dob) {
      newErrors.dob = errorMessages.dob;
      isValid = false;
    } else {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (birthDate > today) {
        newErrors.dob = "Date of birth cannot be in the future.";
        isValid = false;
      }
    }

    if (!formData.email) {
      newErrors.email = errorMessages.email;
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
      isValid = false;
    }

    if (!formData.contact) {
      newErrors.contact = errorMessages.contact;
      isValid = false;
    } else if (!/^\d{10}$/.test(formData.contact)) {
      newErrors.contact = "Please enter a valid 10-digit mobile number.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      toast.error("Please correct the errors before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 200 || response.status === 201) {
        toast.success("Registration initiated! OTP sent to your email.");
        setIsOtpSent(true);
      } else {
        toast.error("Something went wrong. Please try again later.");
      }
    } catch (error: any) {
      toast.error("Error while registering: " + error.message);
    }

    setIsSubmitting(false);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value);
    setOtpError(""); // Clear OTP error when the user starts typing
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setOtpError("OTP is required");
      return;
    }
  
    setIsSubmitting(true); // Set submitting to true during OTP verification
  
    try {
      const response = await fetch("http://localhost:8080/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email, otp }),
      });
  
      const data = await response.json(); 

      if (response.status === 200 || response.status === 201) {
        if (data.token) {
          localStorage.setItem("token", data.token); // Save token in local storage
        }

        toast.success("OTP verified successfully!",{
          duration: 9000, // Time in milliseconds (5000ms = 5 seconds)
        });
 
        navigate("/Welcome"); // Navigate to the welcome page
      } else {
        toast.error("Invalid OTP. Please try again.");
      }
    } catch (error: any) {
      toast.error("Error while verifying OTP: " + error.message);
    }
  
    setIsSubmitting(false); // Reset submitting after OTP verification
  };
  
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isOtpSent && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }

    if (timer === 0) {
      toast.error("OTP expired. Please request a new one.");
      setIsOtpSent(false);
    }

    return () => clearInterval(interval);
  }, [isOtpSent, timer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-blue-100 p-3">
            <UserPlus className="h-12 w-12 text-blue-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                id="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`block w-full border rounded-md p-2 ${
                  errors.fullName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="John Doe"
              />
              {errors.fullName && <p className="text-red-600 text-sm">{errors.fullName}</p>}
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <input
                type="date"
                name="dob"
                id="dob"
                value={formData.dob}
                onChange={handleInputChange}
                max={new Date().toISOString().split("T")[0]}
                className={`block w-full border rounded-md p-2 ${
                  errors.dob ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.dob && <p className="text-red-600 text-sm">{errors.dob}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`block w-full border rounded-md p-2 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
            </div>

            {/* Mobile Number */}
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
                Mobile Number
              </label>
              <input
                type="text"
                name="contact"
                id="contact"
                value={formData.contact}
                onChange={handleInputChange}
                className={`block w-full border rounded-md p-2 ${
                  errors.contact ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="1234567890"
              />
              {errors.contact && <p className="text-red-600 text-sm">{errors.contact}</p>}
            </div>

            {/* OTP Verification */}
            {isOtpSent && (
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  Enter OTP
                </label>
                <input
                  type="text"
                  name="otp"
                  id="otp"
                  value={otp}
                  onChange={handleOtpChange}
                  className={`block w-full border rounded-md p-2 ${
                    otpError ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter OTP"
                />
                {otpError && <p className="text-red-600 text-sm">{otpError}</p>}

                <div className="text-sm text-gray-600 mt-1">
                  {timer > 0 ? (
                    <>OTP expires in {timer}s</>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsOtpSent(false)}
                      className="text-blue-600 hover:text-blue-500"
                    >
                      Request new OTP
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="w-full bg-blue-600 text-white p-2 rounded-md mt-4"
                  disabled={isSubmitting} // Disable button when submitting
                >
                  {isSubmitting ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            )}

            {/* Submit Button */}
            {!isOtpSent && (
              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-2 rounded-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
