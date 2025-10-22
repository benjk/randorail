import React from "react";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { auth } from "./firebaseClient";

interface FormData {
  password: string;
  confirmPassword: string;
}

export function SetPassword() {
  const [serverMsg, setServerMsg] = useState("");
  const [oobCode, setOobCode] = useState("");
  const [codeValid, setCodeValid] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("oobCode");
    if (!code) {
      setServerMsg("Votre lien est invalide.");
      return;
    }

    setOobCode(code);

    verifyPasswordResetCode(auth, code)
      .then(() => setCodeValid(true))
      .catch(() => setServerMsg("Ce lien est invalide ou expiré."));
  }, []);

  const onSubmit = async (data: FormData) => {
    setServerMsg("");

    try {
      await confirmPasswordReset(auth, oobCode, data.password);
      setServerMsg("Mot de passe mis à jour. Redirection...");
      setTimeout(() => {
        window.location.href = "/admin";
      }, 1500);
    } catch (err) {
      setServerMsg("Impossible de mettre à jour le mot de passe.");
    }
  };

  if (!codeValid && !serverMsg) return null;

  return (
    <div className="form-container">
      <h2 className="login-title">Définir un nouveau mot de passe</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-group">
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            className="floating-input"
            autoComplete="new-password"
            {...register("password", {
              required: "Mot de passe requis",
              minLength: {
                value: 6,
                message: "6 caractères minimum",
              },
            })}
          />
          <label className="floating-label">Nouveau mot de passe</label>
          {errors.password && <p className="error-text">{errors.password.message}</p>}
        </div>

        <div className="form-group">
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            className="floating-input"
            autoComplete="new-password"
            {...register("confirmPassword", {
              validate: (value) =>
                value === watch("password") || "Les mots de passe ne correspondent pas",
            })}
          />
          <label className="floating-label">Confirmer le mot de passe</label>
          {errors.confirmPassword && (
            <p className="error-text">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          className={`admin-btn ${isSubmitting ? "loading" : ""}`}
          disabled={isSubmitting}
        >
          <span className="btn-text">Valider</span>
          <span className="loader" />
        </button>

        {serverMsg && (
          <p className={serverMsg.includes("Redirection") ? "admin-msg" : "admin-msg error-msg"}>
            {serverMsg}
          </p>
        )}
      </form>
    </div>
  );
}
