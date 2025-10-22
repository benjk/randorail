import React, { useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "./firebaseClient";
import { useForm } from "react-hook-form";

interface FormData {
  email: string;
  password?: string;
}

export function Login() {
  const URL_SET_PASSWORD = `${window.location.origin}/admin?setmp=true`;
  const [serverError, setServerError] = useState("");
  const [mode, setMode] = useState<"login" | "reset">("login");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  useEffect(() => {
    setServerError("");
  }, [mode]);

  const onSubmit = async (data: FormData) => {
    setServerError("");
    const resetMsg = "Le lien de réinitialisation a été envoyé. Vérifiez votre boîte mail.";

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, data.email, data.password || "");
      }

      if (mode === "reset") {
        await sendPasswordResetEmail(auth, data.email, {
          url: URL_SET_PASSWORD,
        });
      }

      if (mode === "reset") {
        setServerError(resetMsg);
      }
    } catch (error: any) {
      // Pas d’infos pour les hackers
      setServerError(
        mode === "login"
          ? "Identifiants incorrect"
          : resetMsg,
      );
    }
  };

  return (
    <div className="form-container">
      <h2 className="login-title">
        {mode === "login"
          ? "Connexion à l'Administration"
          : "Réinitialisation du mot de passe"}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-group">
          <input
            id="email"
            type="email"
            placeholder="Email"
            className="floating-input"
            autoComplete="email"
            {...register("email", {
              required: "Adresse email requise",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Email invalide",
              },
            })}
          />
          <label className="floating-label" htmlFor="email">
            Email
          </label>
          {errors.email && <p className="error-text">{errors.email.message}</p>}
        </div>

        {mode === "login" && (
          <div className="form-group">
            <input
              id="password"
              type="password"
              placeholder="Mot de passe"
              className="floating-input"
              autoComplete="current-password"
              {...register("password", {
                required: "Mot de passe requis"
              })}
            />
            <label className="floating-label" htmlFor="password">
              Mot de passe
            </label>
            {errors.password && (
              <p className="error-text">{errors.password.message}</p>
            )}
          </div>
        )}

        <button
          type="submit"
          className={`admin-btn ${isSubmitting ? "loading" : ""}`}
          disabled={isSubmitting}
        >
          <span className="btn-text">
            {mode === "login" ? "Connexion" : "Réinitialiser"}
          </span>
          <span className="loader" />
        </button>

        {serverError && (
          <p className={`admin-msg ${mode !== "reset" ? "error-msg" : ""}`}>
            {serverError}
          </p>
        )}
      </form>

      <div className="login-link-container">
        {mode !== "login" && (
          <button className="login-link" onClick={() => setMode("login")}>
            → Connexion
          </button>
        )}
        {mode !== "reset" && (
          <button className="login-link" onClick={() => setMode("reset")}>
            → Réinitialiser le mot de passe
          </button>
        )}
      </div>
    </div>
  );
}
