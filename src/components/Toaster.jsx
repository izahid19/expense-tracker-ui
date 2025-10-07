// src/components/Toaster.jsx
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ✅ Export helper functions
export const successToaster = (message) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 2000,
    pauseOnHover: true,
    draggable: true,
  });
};

export const errorToaster = (message) => {
  toast.error(message, {
    position: "top-right",
    autoClose: 2000,
    pauseOnHover: true,
    draggable: true,
  });
};

// ✅ Component to mount once (usually in App.jsx)
export const Toaster = () => {
  return (
    <ToastContainer
      toastStyle={{
        zIndex: 998, // 👈 Custom z-index
      }}
    />
  );
};