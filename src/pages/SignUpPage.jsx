// src/pages/SignUpPage.jsx
import React, { useState } from "react";
import * as Yup from "yup";
import Curve from "../components/RouteAnimation/Curve";
import axios from "axios";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { BASE_URL } from "../utils/config";
import { useNavigate } from "react-router-dom";

// ✅ Import toaster helpers
import { successToaster, errorToaster } from "../components/Toaster";

const SignUpSchema = Yup.object().shape({
  firstName: Yup.string().required("First Name is required"),
  lastName: Yup.string().required("Last Name is required"),
  emailId: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(/[@$!%*?&#]/, "Password must contain at least one special character (@$!%*?&#)")
    .required("Password is required"),
});

const SignUpPage = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    emailId: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      await SignUpSchema.validate(form, { abortEarly: false });

      const response = await axios.post(`${BASE_URL}/signup`, form, {
        withCredentials: true,
      });
      dispatch(addUser(response?.data?.data));

      // ✅ Show success toaster
      successToaster("Signup successful! Redirecting...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error(err);
      if (err.name === "ValidationError") {
        const formattedErrors = {};
        err.inner.forEach((e) => {
          formattedErrors[e.path] = e.message;
        });
        setErrors(formattedErrors);
      } else if (err.response) {
        errorToaster(err.response.data.message || "Signup failed");
      } else {
        errorToaster("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Curve>
      <div className="flex justify-center items-center mt-10 px-4">
        <div className="card w-96 bg-base-200 shadow-2xl rounded-2xl text-base-content">
          <div className="card-body">
            <h2 className="text-3xl font-bold text-center">Sign Up</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
              {/* First Name */}
              <fieldset className="form-control">
                <label htmlFor="firstName" className="label">
                  <span className="label-text">First Name</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={form.firstName}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-base-100 text-base-content"
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <span className="text-error text-sm mt-1">
                    {errors.firstName}
                  </span>
                )}
              </fieldset>

              {/* Last Name */}
              <fieldset className="form-control">
                <label htmlFor="lastName" className="label">
                  <span className="label-text">Last Name</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={form.lastName}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-base-100 text-base-content"
                  placeholder="Enter your last name"
                />
                {errors.lastName && (
                  <span className="text-error text-sm mt-1">
                    {errors.lastName}
                  </span>
                )}
              </fieldset>

              {/* Email */}
              <fieldset className="form-control">
                <label htmlFor="emailId" className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  id="emailId"
                  name="emailId"
                  type="email"
                  value={form.emailId}
                  onChange={handleChange}
                  className="input input-bordered w-full bg-base-100 text-base-content"
                  placeholder="Enter your email"
                />
                {errors.emailId && (
                  <span className="text-error text-sm mt-1">
                    {errors.emailId}
                  </span>
                )}
              </fieldset>

              {/* Password */}
              <fieldset className="form-control">
                <label htmlFor="password" className="label">
                  <span className="label-text">Password</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    className="input input-bordered flex-1 bg-base-100 text-base-content"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="btn btn-primary"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <span className="text-xs opacity-60 mt-1">
                  Must include uppercase, lowercase, number & special character
                </span>
                <br />
                {errors.password && (
                  <span className="text-error text-sm mt-1">
                    {errors.password}
                  </span>
                )}
              </fieldset>

              <div className="flex justify-center mt-2">
                <button
                  type="submit"
                  className="btn btn-primary w-32"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing up..." : "Sign Up"}
                </button>
              </div>
            </form>

            {/* ✅ Login Link */}
            <div className="text-center mt-4 text-sm opacity-80">
              Already have an account?{" "}
              <span
                onClick={() => navigate("/login")}
                className="underline cursor-pointer hover:text-primary"
              >
                Login
              </span>
            </div>
          </div>
        </div>
      </div>
    </Curve>
  );
};

export default SignUpPage;