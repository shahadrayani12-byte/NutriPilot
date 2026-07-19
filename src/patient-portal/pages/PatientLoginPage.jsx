import { useState } from "react";
import { AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { useTranslation } from "../../i18n";
import { patientAuthService } from "../services/patientAuthService";
import { demoPortalPatient } from "../data/demoPatientPortalData";

export default function PatientLoginPage() {
  const { t } = useTranslation();
  const [accessCode, setAccessCode] = useState("");
  const [verification, setVerification] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = patientAuthService.login({ accessCode, verification });

      if (result.error) {
        setError(result.error);
      } else {
        setIsLoggedIn(true);
      }
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--np-color-surface-page)]">
      {/* Mobile Header */}
      <header className="np-mobile-header">
        <div className="flex min-w-0 items-center gap-3">
          <span className="np-mobile-brand-mark">
            <Lock className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-[var(--np-color-brand)]">
              {t("app.name")}
            </p>
            <h1 className="truncate text-base font-extrabold text-[var(--np-color-text)]">
              {t("patientPortal.login.title", { defaultValue: "Patient Portal" })}
            </h1>
          </div>
        </div>
      </header>

      <main className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {isLoggedIn ? (
            /* Success Panel */
            <div className="space-y-6">
              <div className="rounded-lg bg-white p-6 shadow-[var(--np-shadow-card)]">
                <div className="flex flex-col items-center space-y-4 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--np-color-success-bg)]">
                    <CheckCircle2 className="h-8 w-8 text-[var(--np-color-success)]" />
                  </div>

                  <h2 className="text-2xl font-extrabold text-[var(--np-color-text)]">
                    {t("patientPortal.login.successTitle", { defaultValue: "Welcome" })}
                  </h2>

                  <p className="text-sm text-[var(--np-color-text-muted)]">
                    {t("patientPortal.login.successMessage", {
                      defaultValue: "Logged in as {{name}}",
                      name: demoPortalPatient.fullName,
                    })}
                  </p>

                  <div className="w-full border-t border-[var(--np-color-border)] pt-4">
                    <p className="text-sm font-bold text-[var(--np-color-text)]">
                      {t("patientPortal.login.nextSteps", {
                        defaultValue: "Patient Dashboard Coming Next",
                      })}
                    </p>
                    <p className="mt-2 text-xs text-[var(--np-color-text-muted)]">
                      {t("patientPortal.login.developmentNotice", {
                        defaultValue:
                          "The patient dashboard and care plan features are currently in development. Check back soon!",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--np-color-warning-border)] bg-[var(--np-color-warning-bg)] p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-[var(--np-color-warning)]" />
                  <div className="text-xs text-[var(--np-color-text)]">
                    <p className="font-bold">
                      {t("patientPortal.login.demoNotice", {
                        defaultValue: "Frontend Demo Portal",
                      })}
                    </p>
                    <p className="mt-1">
                      {t("patientPortal.login.demoExplanation", {
                        defaultValue:
                          "This is a frontend demonstration. No production authentication or data security is implemented.",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  setAccessCode("");
                  setVerification("");
                }}
                className="np-button np-button-secondary w-full"
              >
                {t("patientPortal.login.logout", { defaultValue: "Logout" })}
              </button>
            </div>
          ) : (
            /* Login Form */
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--np-color-brand-soft)]">
                  <Lock className="h-6 w-6 text-[var(--np-color-brand)]" />
                </div>
                <h1 className="text-2xl font-extrabold text-[var(--np-color-text)]">
                  {t("patientPortal.login.title", { defaultValue: "Patient Portal" })}
                </h1>
                <p className="mt-2 text-sm text-[var(--np-color-text-muted)]">
                  {t("patientPortal.login.subtitle", {
                    defaultValue: "Access your personalized nutrition care plan",
                  })}
                </p>
              </div>

              {/* Demo Notice */}
              <div className="rounded-lg border border-[var(--np-color-warning-border)] bg-[var(--np-color-warning-bg)] p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-[var(--np-color-warning)]" />
                  <div className="text-xs text-[var(--np-color-text)]">
                    <p className="font-bold">
                      {t("patientPortal.login.demoNotice", {
                        defaultValue: "Frontend Demo Portal",
                      })}
                    </p>
                    <p className="mt-1">
                      {t("patientPortal.login.demoExplanation", {
                        defaultValue:
                          "This is a frontend demonstration. No production authentication or data security is implemented.",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Access Code Field */}
                <div>
                  <label
                    htmlFor="accessCode"
                    className="block text-sm font-bold text-[var(--np-color-text)]"
                  >
                    {t("patientPortal.login.accessCodeLabel", {
                      defaultValue: "Access Code",
                    })}
                  </label>
                  <input
                    type="text"
                    id="accessCode"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder={t("patientPortal.login.accessCodePlaceholder", {
                      defaultValue: "e.g., NP-2026-001",
                    })}
                    className="mt-1 w-full rounded-lg border border-[var(--np-color-border)] bg-white px-4 py-2.5 text-[var(--np-color-text)] placeholder-[var(--np-color-text-soft)] focus:border-[var(--np-color-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--np-color-brand-ring)]"
                    disabled={isLoading}
                  />
                  <p className="mt-1 text-xs text-[var(--np-color-text-muted)]">
                    {t("patientPortal.login.accessCodeHint", {
                      defaultValue:
                        "Provided by your dietitian for this demo",
                    })}
                  </p>
                </div>

                {/* Verification Field */}
                <div>
                  <label
                    htmlFor="verification"
                    className="block text-sm font-bold text-[var(--np-color-text)]"
                  >
                    {t("patientPortal.login.verificationLabel", {
                      defaultValue: "Verification Details",
                    })}
                  </label>
                  <input
                    type="text"
                    id="verification"
                    value={verification}
                    onChange={(e) => setVerification(e.target.value)}
                    placeholder={t("patientPortal.login.verificationPlaceholder", {
                      defaultValue: "Full name or ID",
                    })}
                    className="mt-1 w-full rounded-lg border border-[var(--np-color-border)] bg-white px-4 py-2.5 text-[var(--np-color-text)] placeholder-[var(--np-color-text-soft)] focus:border-[var(--np-color-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--np-color-brand-ring)]"
                    disabled={isLoading}
                  />
                  <p className="mt-1 text-xs text-[var(--np-color-text-muted)]">
                    {t("patientPortal.login.verificationHint", {
                      defaultValue:
                        "A simple verification field for this demo",
                    })}
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex gap-3 rounded-lg border border-[var(--np-color-danger-border)] bg-[var(--np-color-danger-bg)] p-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-[var(--np-color-danger)]" />
                    <p className="text-sm text-[var(--np-color-danger)]">
                      {error}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="np-button np-button-primary w-full"
                >
                  {isLoading
                    ? t("patientPortal.login.loggingIn", {
                        defaultValue: "Signing in...",
                      })
                    : t("patientPortal.login.signIn", { defaultValue: "Sign In" })}
                </button>
              </form>

              {/* Demo Credentials Helper */}
              <details className="rounded-lg border border-[var(--np-color-info-border)] bg-[var(--np-color-info-bg)] p-4">
                <summary className="cursor-pointer font-bold text-[var(--np-color-info)]">
                  {t("patientPortal.login.demoCredentials", {
                    defaultValue: "Demo Credentials",
                  })}
                </summary>
                <div className="mt-3 space-y-2 text-sm text-[var(--np-color-text)]">
                  <p>
                    <strong>
                      {t("patientPortal.login.accessCodeLabel", {
                        defaultValue: "Access Code",
                      })}
                      :
                    </strong>{" "}
                    NP-2026-001
                  </p>
                  <p>
                    <strong>
                      {t("patientPortal.login.verificationLabel", {
                        defaultValue: "Verification Details",
                      })}
                      :
                    </strong>{" "}
                    {t("patientPortal.login.demoCredentialsAny", {
                      defaultValue: "Any text (e.g., your name)",
                    })}
                  </p>
                </div>
              </details>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
