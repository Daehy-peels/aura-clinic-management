"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/toast";

type AuthTab = "login" | "register";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{
    type: "success" | "error";
    title: string;
    description?: string;
  } | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      if (!cancelled && data.user) {
        const { data: staffRow, error: staffError } = await supabase
          .from("staff")
          .select("user_id")
          .eq("user_id", data.user.id)
          .maybeSingle();
        if (!cancelled) {
          if (staffError) {
            // Do not silently misidentify the user as a patient on DB/network error.
            // Remain on /portal so the user can refresh and retry.
            return;
          }
          router.replace(staffRow ? "/dashboard" : "/account");
        }
      }
    }
    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const setFieldError = (field: string, message: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
  };

  const showToast = (type: "success" | "error", title: string, description?: string) => {
    setToast({ type, title, description });
    setTimeout(() => setToast(null), 6000);
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!formData.email.includes("@")) {
      errors.email = "Please enter a valid email address.";
    }

    if (!formData.password.trim()) {
      errors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    if (activeTab === "register") {
      if (!formData.firstName.trim()) {
        errors.firstName = "First name is required.";
      }
      if (!formData.lastName.trim()) {
        errors.lastName = "Last name is required.";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});
    setToast(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    if (activeTab === "register") {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback?next=/account`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        },
      });

      setLoading(false);

      if (error) {
        setFieldError("email", error.message);
        showToast("error", "Registration failed", error.message);
      } else {
        setFormData({ email: "", password: "", firstName: "", lastName: "" });
        setActiveTab("login");
        showToast(
          "success",
          "Account created",
          "Please check your email to confirm your address, then sign in.",
        );
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      setLoading(false);

      if (error) {
        setFieldError("password", error.message);
        showToast("error", "Sign in failed", error.message);
      } else {
        const userId = data.user?.id;
        const { data: staffRow, error: staffError } = userId
          ? await supabase
              .from("staff")
              .select("user_id")
              .eq("user_id", userId)
              .maybeSingle()
          : { data: null, error: true };

        router.push(!staffError && staffRow ? "/dashboard" : "/account");
        router.refresh();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f7] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#ffd9dc]/40 blur-[120px] rounded-full z-0" />
      <div className="absolute bottom-[0%] left-[-5%] w-[450px] h-[450px] bg-[#eddfe0]/60 blur-[100px] rounded-full z-0" />

      <div className="relative z-10 max-w-md w-full bg-white border border-[#d8c1c3]/30 rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_40px_rgba(0,0,0,0.05)]">
        {/* Tab System */}
        <div className="flex p-1 gap-1 bg-[#f9ebeb]/60 rounded-xl mb-10">
          <button
            onClick={() => {
              setActiveTab("login");
              setToast(null);
              setFieldErrors({});
            }}
            className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
              activeTab === "login"
                ? "bg-[#8f4953] text-white shadow-sm shadow-[#8f4953]/20"
                : "text-[#8f4953]/60 hover:text-[#8f4953]"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setActiveTab("register");
              setToast(null);
              setFieldErrors({});
            }}
            className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
              activeTab === "register"
                ? "bg-[#8f4953] text-white shadow-sm shadow-[#8f4953]/20"
                : "text-[#8f4953]/60 hover:text-[#8f4953]"
            }`}
          >
            Register
          </button>
        </div>

        {toast && (
          <Toast
            isOpen={true}
            type={toast.type}
            title={toast.title}
            description={toast.description}
            onClose={() => setToast(null)}
          />
        )}

        <div className="px-2 pb-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-serif text-[#8f4953] mb-3 tracking-tight">
              {activeTab === "login" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-sm text-[#211a1a]/60 font-light tracking-wide italic">
              {activeTab === "login"
                ? "Enter your clinical sanctuary"
                : "Begin your curated Aura journey"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === "register" && (
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  id="firstName"
                  label="First Name"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                  placeholder="e.g. Harry"
                  showPassword={showPassword}
                  toggleShowPassword={toggleShowPassword}
                  fieldErrors={fieldErrors}
                  clearFieldError={clearFieldError}
                />
                <InputField
                  id="lastName"
                  label="Last Name"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                  placeholder="e.g. DuBois"
                  showPassword={showPassword}
                  toggleShowPassword={toggleShowPassword}
                  fieldErrors={fieldErrors}
                  clearFieldError={clearFieldError}
                />
              </div>
            )}

            <InputField
              id="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              placeholder="hello@email.com"
              showPassword={showPassword}
              toggleShowPassword={toggleShowPassword}
              fieldErrors={fieldErrors}
              clearFieldError={clearFieldError}
            />

            <InputField
              id="password"
              label="Secret Password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              placeholder="••••••••"
              showToggle
              showPassword={showPassword}
              toggleShowPassword={toggleShowPassword}
              fieldErrors={fieldErrors}
              clearFieldError={clearFieldError}
            />

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-[#8f4953] text-white py-5 rounded-xl text-[11px] font-bold uppercase tracking-[0.4em] shadow-sm shadow-[#8f4953]/20 hover:bg-[#7a3d4e] hover:scale-[1.01] active:scale-99 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {loading
                  ? "Processing..."
                  : activeTab === "login"
                    ? "Sign In"
                    : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function InputField({
  id,
  label,
  type,
  value,
  onChange,
  required,
  placeholder,
  showToggle,
  showPassword,
  toggleShowPassword,
  fieldErrors,
  clearFieldError,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  showToggle?: boolean;
  showPassword: boolean;
  toggleShowPassword: () => void;
  fieldErrors: Record<string, string>;
  clearFieldError: (field: string) => void;
}) {
  const error = fieldErrors[id];
  const isPassword = type === "password";
  const actualType = isPassword && !showPassword ? "password" : "text";

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[#8f4953] ml-1"
      >
        {label}
        {required && <span className="text-xs text-rose-500">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={actualType}
          required={required}
          value={value}
          className={`w-full bg-[#f9ebeb]/40 border rounded-2xl px-5 py-4 focus:bg-white focus:border-[#8f4953] focus:ring-1 focus:ring-[#8f4953]/20 outline-none transition-all font-light text-[#211a1a] ${
            error ? "border-rose-500" : "border-[#d8c1c3]/30"
          }`}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e);
            if (error) clearFieldError(id);
          }}
        />
        {showToggle && (
          <button
            type="button"
            onClick={toggleShowPassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#534344]/60 hover:text-[#8f4953] transition-colors"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {error && (
        <p className="text-[9px] font-medium text-rose-500 ml-1 mt-0.5">
          {error}
        </p>
      )}
    </div>
  );
}
