import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import Swal from "sweetalert2/dist/sweetalert2.js";
import "sweetalert2/dist/sweetalert2.css";
import { motion } from "framer-motion";

export default function AuthPage({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    gender: "male", // Default gender
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5000/auth/${isLogin ? "login" : "signup"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(isLogin ? { email: formData.email, password: formData.password } : formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        Swal.fire({
          icon: "success",
          title: isLogin ? "Welcome back!" : "Account created successfully!",
          showConfirmButton: false,
          timer: 1500,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#fff",
          customClass: { popup: "rounded-2xl" },
        });

        onAuthSuccess(data.user);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err.message,
        confirmButtonColor: "#ef4444",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "#fff",
        customClass: { popup: "rounded-2xl", confirmButton: "rounded-lg px-6 py-2" },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl rounded-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-white drop-shadow-md">
              {isLogin ? "Welcome Back" : "Create an Account"}
            </CardTitle>
            <p className="text-sm text-gray-200 mt-1">
              {isLogin
                ? "Login to continue your journey 🚀"
                : "Join us and get started ✨"}
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-100">
                      Name
                    </Label>
                    <Input
                      id="name"
                      className="bg-white/20 text-white placeholder-gray-200 border-white/30"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-gray-100">
                      Gender
                    </Label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, gender: e.target.value }))
                      }
                      className="w-full bg-white/20 text-white border-white/30 rounded-lg p-2 text-center"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-100">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  className="bg-white/20 text-white placeholder-gray-200 border-white/30"
                  placeholder="example@mail.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-100">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  className="bg-white/20 text-white placeholder-gray-200 border-white/30"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-lg hover:scale-[1.02] transition-transform"
                disabled={loading}
              >
                {loading
                  ? "Processing..."
                  : isLogin
                  ? "Login"
                  : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                className="text-sm text-gray-100 hover:text-white transition"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin
                  ? "Don’t have an account? Sign Up"
                  : "Already have an account? Login"}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}