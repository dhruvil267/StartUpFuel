import React, { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { validateEmail, validatePassword } from "../../utils/helpers";
import { TrendingUp, AlertCircle, Check, X } from "lucide-react";
import styles from "./Register.module.css";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const { register, loading, isAuthenticated, error } = useAuthContext();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!validatePassword(formData.password)) {
      newErrors.password = "Password must meet security requirements";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
    }
  };

  const passwordValidation = [
    { rule: "At least 8 characters", valid: formData.password.length >= 8 },
    {
      rule: "Contains uppercase letter",
      valid: /[A-Z]/.test(formData.password),
    },
    {
      rule: "Contains lowercase letter",
      valid: /[a-z]/.test(formData.password),
    },
    { rule: "Contains number", valid: /\d/.test(formData.password) },
    {
      rule: "Contains special character",
      valid: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <TrendingUp className={styles.logoIcon} />
        </div>

        <div className={styles.header}>
          <h2 className={styles.title}>Create your account</h2>
          <p className={styles.subtitle}>
            Join StartupFuel and start tracking your investments
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && (
            <div className={styles.errorMessage}>
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          <div className={styles.nameFields}>
            <div className={styles.formGroup}>
              <label htmlFor="firstName" className={styles.label}>
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                value={formData.firstName}
                onChange={handleChange}
                className={`${styles.input} ${
                  errors.firstName ? styles.inputError : ""
                }`}
                placeholder="First name"
              />
              {errors.firstName && (
                <p className={styles.errorMessage}>{errors.firstName}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="lastName" className={styles.label}>
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                value={formData.lastName}
                onChange={handleChange}
                className={`${styles.input} ${
                  errors.lastName ? styles.inputError : ""
                }`}
                placeholder="Last name"
              />
              {errors.lastName && (
                <p className={styles.errorMessage}>{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={`${styles.input} ${
                errors.email ? styles.inputError : ""
              }`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className={styles.errorMessage}>{errors.email}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <div className={styles.passwordContainer}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`${styles.input} ${
                  errors.password ? styles.inputError : ""
                }`}
                placeholder="Create a password"
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
              ></button>
            </div>
            {errors.password && (
              <p className={styles.errorMessage}>{errors.password}</p>
            )}

            {/* Password validation */}
            {formData.password && (
              <div className={styles.passwordValidation}>
                <div className={styles.validationTitle}>
                  Password requirements:
                </div>
                <div className={styles.validationList}>
                  {passwordValidation.map((item, index) => (
                    <div key={index} className={styles.validationItem}>
                      {item.valid ? (
                        <Check
                          className={`${styles.validationIcon} ${styles.validationIconValid}`}
                        />
                      ) : (
                        <X
                          className={`${styles.validationIcon} ${styles.validationIconInvalid}`}
                        />
                      )}
                      <span
                        className={
                          item.valid
                            ? styles.validationTextValid
                            : styles.validationTextInvalid
                        }
                      >
                        {item.rule}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirm Password
            </label>
            <div className={styles.passwordContainer}>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`${styles.input} ${
                  errors.confirmPassword ? styles.inputError : ""
                }`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              ></button>
            </div>
            {errors.confirmPassword && (
              <p className={styles.errorMessage}>{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${styles.submitButton} ${
              loading ? styles.submitButtonLoading : ""
            }`}
          >
            {loading && <div className={styles.spinner}></div>}
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className={styles.divider}>
          <div className={styles.dividerLine}>
            <div className={styles.dividerLineBorder} />
          </div>
          <div className={styles.dividerText}>
            <span>Already have an account?</span>
          </div>
        </div>

        <div className={styles.loginLink}>
          <p className={styles.loginText}>
            <Link to="/login" className={styles.loginLinkText}>
              Sign in to your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
