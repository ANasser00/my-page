// components/AuthForm.tsx
import React, { useState } from "react";
import { loginUser } from "@/graphql/queries/login";
import { useRouter } from "next/router";

const AuthForm: React.FC = () => {
  const [identifier, setIdentifier] = useState(""); // Email or Username
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const token = await loginUser({ identifier, password });
      localStorage.setItem("token", token.token); // Store JWT locally
      router.push("/profile");
    } catch (err: any) {
      setError(err.message || "Login failed.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      <label>
        Email or Username:
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Enter your email or username"
          required
        />
      </label>
      <label>
        Password:
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      <button type="submit">Login</button>
    </form>
  );
};

export default AuthForm;
