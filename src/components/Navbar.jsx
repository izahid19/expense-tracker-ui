import { useSelector, useDispatch } from "react-redux";
import { BASE_URL } from "../utils/config";
import axios from "axios";
import { removeUser } from "../utils/userSlice";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { successToaster, errorToaster } from "./Toaster";
import { Sun, Moon } from "lucide-react";

const Navbar = () => {
  const [theme, setTheme] = useState("light");
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const handleThemeToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${BASE_URL}/logout`, {}, { withCredentials: true });
      dispatch(removeUser());
      successToaster("Logged Out Successfully");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error(err);
      errorToaster("Logout failed");
    }
  };

  return (
    <div className="navbar bg-base-100 text-base-content shadow-md border-b border-base-300 sticky top-0 z-50 backdrop-blur-sm">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost normal-case text-xl font-bold">
          Expense Tracker
        </Link>
      </div>

      <div className="flex gap-3 items-center">
        {user && user.firstName ? (
          <>
            <span className="hidden md:inline text-sm font-medium opacity-80">
              Welcome {user.firstName}
            </span>

            {/* Avatar Dropdown */}
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar"
              >
                <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img
                    alt="User Avatar"
                    src={
                      user.profilePicture ||
                      "https://i.pravatar.cc/100"
                    }
                  />
                </div>
              </div>

              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content bg-base-200 text-base-content rounded-box z-[1] mt-3 w-52 p-2 shadow"
              >
                <li>
                  <Link className="justify-between" to="/profile">
                    Profile
                    <span className="badge badge-primary">New</span>
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard">Dashboard</Link>
                </li>
                <li
                  onClick={handleLogout}
                  className="cursor-pointer text-error font-semibold"
                >
                  <a>Logout</a>
                </li>

                <div className="divider my-1"></div>

                {/* Theme Toggle */}
                <li>
                  <button
                    onClick={handleThemeToggle}
                    className="flex items-center justify-between w-full font-medium transition-all"
                  >
                    <span>
                      {theme === "light" ? "Light Mode" : "Dark Mode"}
                    </span>
                    <div className="ml-2 transition-transform duration-300">
                      {theme === "light" ? (
                        <Sun className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <Moon className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                  </button>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline btn-sm">
              Login
            </Link>
            <Link to="/signup" className="btn btn-primary btn-sm">
              Signup
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={handleThemeToggle}
              className="flex items-center justify-between font-medium transition-all ml-2"
            >
              {theme === "light" ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-blue-400" />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;
