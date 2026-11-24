import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../services/api";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.warning("Email is required");
      return;
    }

    try {
      await API.post("/auth/forgot-password", { email });
      toast.success("If this email exists, a reset link has been sent");
      setEmail("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to send reset email");
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Forgot Password</h2>

        <input
          type="email"
          placeholder="Enter your account email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button type="submit">Send Reset Link</button>

        <p className="auth-switch-text">
          Remember password? <Link to="/login">Sign In</Link>
        </p>
      </form>
    </div>
  );
}

export default ForgotPasswordPage;