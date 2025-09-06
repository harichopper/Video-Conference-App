import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Video, User, LogOut, Settings, X, Save, SunMoon } from "lucide-react";
import { useState, useEffect } from "react";
import Swal from "sweetalert2/dist/sweetalert2.js";
import "sweetalert2/dist/sweetalert2.css";
import { motion } from "framer-motion";

export default function HomePage({
  meetingId,
  setMeetingId,
  username,
  setUsername,
  handleCreateMeeting,
  handleJoinMeeting,
  onLogout,
}) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editGender, setEditGender] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  const [userProfile, setUserProfile] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    gender: "male",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=John`,
    joinDate: "Jan 2024",
    meetingsAttended: 42,
    status: "online",
  });

  // Function to generate avatar based on gender
  const generateAvatar = (name, gender) => {
    const seed = encodeURIComponent(name || "User");
    const baseUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    
    if (gender === "female") {
      return `${baseUrl}&hair=longHairBigHair,longHairBob,longHairBun,longHairCurly,longHairCurvy,longHairDreads,longHairFro,longHairFroBand,longHairNotTooLong,longHairShavedSides,longHairMiaWallace,longHairStraight,longHairStraight2,longHairStraightStrand&facialHair=blank&top=longHairBigHair,longHairBob,longHairBun,longHairCurly,longHairCurvy,longHairDreads,longHairFro,longHairFroBand,longHairNotTooLong,longHairShavedSides,longHairMiaWallace,longHairStraight,longHairStraight2,longHairStraightStrand`;
    } else {
      return `${baseUrl}&hair=shortHairDreads01,shortHairDreads02,shortHairFrizzle,shortHairShaggyMullet,shortHairShortCurly,shortHairShortFlat,shortHairShortRound,shortHairShortWaved,shortHairSides,shortHairTheCaesar,shortHairTheCaesarSidePart&facialHair=blank,beardMedium,beardLight,beardMajestic,moustacheFancy,moustacheMagnum&top=shortHairDreads01,shortHairDreads02,shortHairFrizzle,shortHairShaggyMullet,shortHairShortCurly,shortHairShortFlat,shortHairShortRound,shortHairShortWaved,shortHairSides,shortHairTheCaesar,shortHairTheCaesarSidePart`;
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No token found, using default profile");
          // Use default profile when no token
          setUserProfile({
            name: username || "User",
            email: "user@example.com",
            gender: "male",
            avatar: generateAvatar(username || "User", "male"),
            joinDate: "Recently",
            meetingsAttended: 0,
            status: "online",
          });
          setEditName(username || "User");
          setEditGender("male");
          setIsLoading(false);
          return;
        }

        console.log("Fetching user data with token...");
        const response = await fetch("http://localhost:5000/auth/user", {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (response.status === 401) {
          console.log("Token expired or invalid, clearing localStorage");
          // Token is expired or invalid, clear it and use default profile
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          
          // Use default profile
          setUserProfile({
            name: username || "User",
            email: "user@example.com",
            gender: "male",
            avatar: generateAvatar(username || "User", "male"),
            joinDate: "Recently",
            meetingsAttended: 0,
            status: "online",
          });
          setEditName(username || "User");
          setEditGender("male");
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const user = await response.json();
        console.log("User data fetched successfully:", user);
        
        const avatar = user.avatar || generateAvatar(user.name || "User", user.gender || "male");

        setUserProfile({
          name: user.name || "User",
          email: user.email || "user@example.com",
          gender: user.gender || "male",
          avatar: avatar,
          joinDate: user.joinedAt
            ? new Date(user.joinedAt).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })
            : "Recently",
          meetingsAttended: user.meetings?.length || 0,
          status: "online",
        });
        setEditName(user.name || "User");
        setEditGender(user.gender || "male");
        
        // Update username if it's different
        if (user.name && user.name !== username) {
          setUsername(user.name);
        }
        
      } catch (err) {
        console.error("Error fetching user data:", err);
        
        // Use default profile on any error
        setUserProfile({
          name: username || "User",
          email: "user@example.com",
          gender: "male",
          avatar: generateAvatar(username || "User", "male"),
          joinDate: "Recently",
          meetingsAttended: 0,
          status: "online",
        });
        setEditName(username || "User");
        setEditGender("male");
        
        // Only show error alert if we had a token (meaning the user was supposed to be logged in)
        const token = localStorage.getItem("token");
        if (token) {
          Swal.fire({
            icon: "warning",
            title: "Session Expired",
            text: "Your session has expired. You can continue using the app with limited features.",
            confirmButtonColor: "#8b5cf6",
            background:
              theme === "dark"
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : "linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)",
            color: theme === "dark" ? "#fff" : "#1f2937",
            customClass: { popup: "rounded-2xl", confirmButton: "rounded-lg px-6 py-2" },
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [theme, username]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handleOpenProfile = () => {
    setShowProfile(true);
    setEditName(userProfile.name);
    setEditGender(userProfile.gender);
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Name",
        text: "Name cannot be empty.",
        confirmButtonColor: "#8b5cf6",
        background:
          theme === "dark"
            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            : "linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)",
        color: theme === "dark" ? "#fff" : "#1f2937",
        customClass: { popup: "rounded-2xl", confirmButton: "rounded-lg px-6 py-2" },
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        // If no token, just update local state
        const newAvatar = generateAvatar(editName, editGender);
        setUserProfile((prev) => ({
          ...prev,
          name: editName,
          gender: editGender,
          avatar: newAvatar,
        }));
        setUsername(editName); // Update the global username state
        setIsEditing(false);
        
        Swal.fire({
          icon: "success",
          title: "Profile Updated!",
          text: "Your profile has been updated locally.",
          showConfirmButton: false,
          timer: 1500,
          background:
            theme === "dark"
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : "linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)",
          color: theme === "dark" ? "#fff" : "#1f2937",
          customClass: { popup: "rounded-2xl" },
        });
        return;
      }

      const newAvatar = generateAvatar(editName, editGender);

      const response = await fetch("http://localhost:5000/auth/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName, gender: editGender, avatar: newAvatar }),
      });

      if (response.status === 401) {
        // Token expired, clear it and update locally
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        
        setUserProfile((prev) => ({
          ...prev,
          name: editName,
          gender: editGender,
          avatar: newAvatar,
        }));
        setUsername(editName);
        setIsEditing(false);
        
        Swal.fire({
          icon: "warning",
          title: "Session Expired",
          text: "Your session expired, but your profile has been updated locally.",
          confirmButtonColor: "#8b5cf6",
          background:
            theme === "dark"
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : "linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)",
          color: theme === "dark" ? "#fff" : "#1f2937",
          customClass: { popup: "rounded-2xl", confirmButton: "rounded-lg px-6 py-2" },
        });
        return;
      }

      if (!response.ok) throw new Error("Failed to update profile");

      setUserProfile((prev) => ({
        ...prev,
        name: editName,
        gender: editGender,
        avatar: newAvatar,
      }));
      setUsername(editName);
      setIsEditing(false);
      
      Swal.fire({
        icon: "success",
        title: "Profile Updated!",
        text: "Your profile has been updated successfully.",
        showConfirmButton: false,
        timer: 1500,
        background:
          theme === "dark"
            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            : "linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)",
        color: theme === "dark" ? "#fff" : "#1f2937",
        customClass: { popup: "rounded-2xl" },
      });
    } catch (err) {
      console.error("Error updating profile:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update profile. Please try again.",
        confirmButtonColor: "#ef4444",
        background:
          theme === "dark"
            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            : "linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)",
        color: theme === "dark" ? "#fff" : "#1f2937",
        customClass: { popup: "rounded-2xl", confirmButton: "rounded-lg px-6 py-2" },
      });
    }
  };

  const handleCreateMeetingWithAlert = () => {
    Swal.fire({
      icon: "success",
      title: "Meeting Created!",
      text: "Your new meeting has been created successfully.",
      showConfirmButton: false,
      timer: 2000,
      background:
        theme === "dark"
          ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          : "linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)",
      color: theme === "dark" ? "#fff" : "#1f2937",
      customClass: { popup: "rounded-2xl" },
    }).then(() => {
      handleCreateMeeting();
    });
  };

  const validateAndJoin = async () => {
    if (!meetingId.trim() || !username.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please enter both meeting ID and your name.",
        confirmButtonColor: "#8b5cf6",
        background:
          theme === "dark"
            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            : "linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)",
        color: theme === "dark" ? "#fff" : "#1f2937",
        customClass: { popup: "rounded-2xl", confirmButton: "rounded-lg px-6 py-2" },
      });
      return;
    }

    setIsValidating(true);
    setValidationError("");

    try {
      // Clean the meeting ID (trim whitespace and ensure uppercase)
      const cleanMeetingId = meetingId.trim().toUpperCase();
      console.log(`Validating meeting ID: "${cleanMeetingId}"`);
      
      const response = await fetch(`http://localhost:5000/meeting/validate/${encodeURIComponent(cleanMeetingId)}`);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Meeting validation response:', data);

      if (data.valid) {
        // Update the meeting ID with the validated version from the server
        const validatedMeetingId = data.meetingId || cleanMeetingId;
        setMeetingId(validatedMeetingId);
        
        console.log(`✅ Meeting "${validatedMeetingId}" is valid, joining as "${username}"`);
        
        Swal.fire({
          icon: "success",
          title: "Joining Meeting!",
          text: `Welcome ${username}! Connecting to meeting ${validatedMeetingId}...`,
          showConfirmButton: false,
          timer: 2000,
          background:
            theme === "dark"
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : "linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)",
          color: theme === "dark" ? "#fff" : "#1f2937",
          customClass: { popup: "rounded-2xl" },
        }).then(() => {
          handleJoinMeeting();
        });
      } else {
        setValidationError(data.message || "Invalid meeting ID or meeting has ended");
        Swal.fire({
          icon: "error",
          title: "Meeting Not Found",
          text: data.message || "Invalid meeting ID or meeting has ended",
          confirmButtonColor: "#ef4444",
          background:
            theme === "dark"
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : "linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)",
          color: theme === "dark" ? "#fff" : "#1f2937",
          customClass: { popup: "rounded-2xl", confirmButton: "rounded-lg px-6 py-2" },
        });
      }
    } catch (err) {
      console.error("Error validating meeting:", err);
      
      // For development, allow joining any meeting ID
      console.log("🔧 Development mode: allowing meeting join without validation");
      
      Swal.fire({
        icon: "info",
        title: "Development Mode",
        text: `Joining meeting ${meetingId.trim().toUpperCase()} without validation...`,
        showConfirmButton: false,
        timer: 2000,
        background:
          theme === "dark"
            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            : "linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)",
        color: theme === "dark" ? "#fff" : "#1f2937",
        customClass: { popup: "rounded-2xl" },
      }).then(() => {
        setMeetingId(meetingId.trim().toUpperCase());
        handleJoinMeeting();
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out of your account!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#8b5cf6",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Yes, logout!",
      cancelButtonText: "Cancel",
      background:
        theme === "dark"
          ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          : "linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)",
      color: theme === "dark" ? "#fff" : "#1f2937",
      customClass: {
        popup: "rounded-2xl",
        confirmButton: "rounded-lg px-6 py-2",
        cancelButton: "rounded-lg px-6 py-2",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("token");
        Swal.fire({
          icon: "success",
          title: "Goodbye!",
          text: "You have been successfully logged out.",
          showConfirmButton: false,
          timer: 2000,
          background:
            theme === "dark"
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : "linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)",
          color: theme === "dark" ? "#fff" : "#1f2937",
          customClass: { popup: "rounded-2xl" },
        }).then(() => {
          setShowProfile(false);
          if (onLogout) {
            onLogout();
          } else {
            console.error("onLogout prop is not defined");
          }
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center p-6 ${
          theme === "dark"
            ? "bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500"
            : "bg-gradient-to-br from-gray-100 via-blue-100 to-purple-100"
        }`}
      >
        <p className={theme === "dark" ? "text-white" : "text-gray-900"}>Loading...</p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-6 ${
        theme === "dark"
          ? "bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500"
          : "bg-gradient-to-br from-gray-100 via-blue-100 to-purple-100"
      }`}
    >
      <div className="fixed top-4 right-4 z-50 flex space-x-2">
        <Button
          onClick={toggleTheme}
          className={`${
            theme === "dark"
              ? "bg-white/20 hover:bg-white/30 text-white border border-white/30"
              : "bg-white/90 hover:bg-white text-gray-900 border border-gray-200 shadow-lg"
          } rounded-full p-3 transition-all duration-200`}
          title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
        >
          <SunMoon className="h-6 w-6" />
        </Button>
        <Button
          onClick={handleOpenProfile}
          className={`${
            theme === "dark"
              ? "bg-white/20 hover:bg-white/30 text-white border border-white/30"
              : "bg-white/90 hover:bg-white text-gray-900 border border-gray-200 shadow-lg"
          } rounded-full p-3 transition-all duration-200`}
        >
          <User className="h-6 w-6" />
        </Button>
      </div>

      {showProfile && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <Card
            className={`w-full max-w-md backdrop-blur-lg ${
              theme === "dark" ? "bg-white/10 border-white/20" : "bg-white/30 border-gray-200/30"
            } shadow-2xl rounded-2xl`}
          >
            <CardHeader className="relative text-center pb-4">
              <Button
                onClick={() => setShowProfile(false)}
                variant="ghost"
                className={`absolute top-2 right-2 p-2 ${
                  theme === "dark" ? "text-gray-200 hover:text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="relative mx-auto mb-4">
                <div
                  className={`w-24 h-24 rounded-full ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"
                      : "bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"
                  } p-1`}
                >
                  <img
                    src={userProfile.avatar}
                    alt="Profile"
                    className="w-full h-full rounded-full bg-white object-cover"
                    onError={(e) => {
                      e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${userProfile.name}`;
                    }}
                  />
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 ${
                    theme === "dark" ? "border-white" : "border-gray-200"
                  } ${userProfile.status === "online" ? "bg-green-500" : "bg-gray-400"}`}
                ></div>
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={`${
                      theme === "dark"
                        ? "bg-white/20 text-white placeholder-gray-200 border-white/30"
                        : "bg-gray-100/50 text-gray-900 placeholder-gray-500 border-gray-200/50"
                    } text-center`}
                    placeholder="Enter your name"
                  />
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className={`w-full ${
                      theme === "dark"
                        ? "bg-white/20 text-white border-white/30"
                        : "bg-gray-100/50 text-gray-900 border-gray-200/50"
                    } rounded-lg p-2 text-center`}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              ) : (
                <CardTitle
                  className={`text-xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  } drop-shadow-md`}
                >
                  {userProfile.name}
                </CardTitle>
              )}
              <p className={theme === "dark" ? "text-sm text-gray-200" : "text-sm text-gray-600"}>
                {userProfile.email}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div
                  className={`p-3 rounded-lg ${
                    theme === "dark" ? "bg-white/20" : "bg-gray-100/50"
                  }`}
                >
                  <div
                    className={`text-2xl font-bold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {userProfile.meetingsAttended}
                  </div>
                  <div
                    className={`text-xs ${theme === "dark" ? "text-gray-200" : "text-gray-600"}`}
                  >
                    Meetings
                  </div>
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    theme === "dark" ? "bg-white/20" : "bg-gray-100/50"
                  }`}
                >
                  <div
                    className={`text-lg font-bold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {userProfile.joinDate}
                  </div>
                  <div
                    className={`text-xs ${theme === "dark" ? "text-gray-200" : "text-gray-600"}`}
                  >
                    Member Since
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {isEditing ? (
                  <Button
                    onClick={handleSaveProfile}
                    className={`w-full border ${
                      theme === "dark"
                        ? "bg-white/20 border-white/30 text-white hover:bg-white/30"
                        : "bg-indigo-500 hover:bg-indigo-600 border-indigo-600 text-white"
                    } hover:scale-[1.02] transition-transform`}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </Button>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className={`w-full border ${
                      theme === "dark"
                        ? "bg-white/20 border-white/30 text-white hover:bg-white/30"
                        : "bg-gray-600 hover:bg-gray-700 border-gray-600 text-white"
                    } hover:scale-[1.02] transition-transform`}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}

                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className={`w-full border ${
                    theme === "dark"
                      ? "bg-red-500/20 border-red-400/30 text-red-300 hover:bg-red-500/30 hover:border-red-400/50"
                      : "bg-red-500 hover:bg-red-600 border-red-500 text-white"
                  } hover:scale-[1.02] transition-transform`}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card
          className={`backdrop-blur-lg ${
            theme === "dark" ? "bg-white/10 border-white/20" : "bg-white/30 border-gray-200/30"
          } shadow-2xl rounded-2xl`}
        >
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div
                className={`p-3 rounded-full ${
                  theme === "dark" ? "bg-white/20" : "bg-gray-100/50"
                }`}
              >
                <Video
                  className={`h-10 w-10 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                />
              </div>
            </div>
            <CardTitle
              className={`text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              } drop-shadow-md`}
            >
              Video Conference
            </CardTitle>
            <p className={theme === "dark" ? "text-sm text-gray-200" : "text-sm text-gray-600"}>
              Connect with your team anytime, anywhere
            </p>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-6">
            <div className="space-y-4">
              <Button
                onClick={handleCreateMeetingWithAlert}
                className={`w-full py-6 text-lg ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white"
                    : "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white"
                } shadow-lg hover:scale-[1.02] transition-transform`}
              >
                New Meeting
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div
                    className={`w-full border-t ${
                      theme === "dark" ? "border-white/30" : "border-gray-200/50"
                    }`}
                  ></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span
                    className={`px-2 bg-transparent ${
                      theme === "dark" ? "text-gray-200" : "text-gray-600"
                    }`}
                  >
                    or
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Enter meeting ID"
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value.toUpperCase())}
                  maxLength={20}  // Increased from 8 to 20
                  className={`py-3 ${
                    theme === "dark"
                      ? "bg-white/20 text-white placeholder-gray-200 border-white/30"
                      : "bg-gray-100/50 text-gray-900 placeholder-gray-500 border-gray-200/50"
                    }`}
                />
                <Input
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={50}  // Increased from 20 to 50
                  className={`py-3 ${
                    theme === "dark"
                      ? "bg-white/20 text-white placeholder-gray-200 border-white/30"
                      : "bg-gray-100/50 text-gray-900 placeholder-gray-500 border-gray-200/50"
                    }`}
                />

                {validationError && (
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-red-300" : "text-red-600"
                    } mt-2`}
                  >
                    {validationError}
                  </p>
                )}

                <Button
                  onClick={validateAndJoin}
                  className={`w-full py-6 text-lg border ${
                    theme === "dark"
                      ? "bg-white/20 border-white/30 text-white hover:bg-white/30"
                      : "bg-indigo-500 hover:bg-indigo-600 border-indigo-600 text-white"
                  } hover:scale-[1.02] transition-transform`}
                  disabled={!meetingId.trim() || !username.trim() || isValidating}
                >
                  {isValidating ? "Validating..." : "Join Meeting"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}