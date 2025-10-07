import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/config";
import { successToaster, errorToaster } from "../components/Toaster";
import Curve from "../components/RouteAnimation/Curve";
import { useDispatch, useSelector } from "react-redux";
import { addUser } from "../utils/userSlice";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);

  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    emailId: user?.emailId || "",
    age: user?.age || "",
    gender: user?.gender || "",
    profilePicture: user?.profilePicture || "",
    monthlyExpense: user?.monthlyExpense || "",
    weeklyExpense: user?.weeklyExpense || "",
  });

  const getChangedFields = (original, updated) => {
    const changes = {};
    for (let key in updated) {
      if (JSON.stringify(updated[key]) !== JSON.stringify(original[key])) {
        changes[key] = updated[key];
      }
    }
    return changes;
  };

  const updateProfile = async () => {
    try {
      setIsSaving(true);
      const changes = getChangedFields(user, formData);

      if (Object.keys(changes).length === 0) {
        successToaster("No changes to update");
        setIsSaving(false);
        return;
      }

      const response = await axios.patch(`${BASE_URL}/profile/update`, changes);
      dispatch(addUser(response.data));
      successToaster("Profile updated successfully!");
      setHasChanges(false);
    } catch (error) {
      errorToaster("Failed to update profile");
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
      setShowConfirmModal(false);
    }
  };

  useEffect(() => {
    if (user) {
      const changes = getChangedFields(user, formData);
      setHasChanges(Object.keys(changes).length > 0);
    }
  }, [formData, user]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        emailId: user.emailId || "",
        age: user.age || "",
        gender: user.gender || "",
        profilePicture: user.profilePicture || "",
        monthlyExpense: user.monthlyExpense || "",
        weeklyExpense: user.weeklyExpense || "",
      });
      setHasChanges(false);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "age" || name === "monthlyExpense" || name === "weeklyExpense"
        ? parseInt(value) || ""
        : value,
    }));
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      emailId: user.emailId || "",
      age: user.age || "",
      gender: user.gender || "",
      profilePicture: user.profilePicture || "",
      monthlyExpense: user.monthlyExpense || "",
      weeklyExpense: user.weeklyExpense || "",
    });
    setHasChanges(false);
  };

  if (!user) {
    return (
      <Curve>
        <div className="min-h-screen flex justify-center items-center bg-base-100">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </Curve>
    );
  }

  return (
    <Curve>
      <div className="min-h-screen bg-base-100 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">My Profile</h1>
            <p className="text-base-content/70">Manage your personal information</p>
          </div>

          <div className="card bg-base-200 shadow-2xl">
            <div className="card-body p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Profile Picture Section */}
                <div className="flex-shrink-0 text-center">
                  <div className="avatar">
                    <div className="w-32 h-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-4 mx-auto">
                      <img
                        src={formData.profilePicture}
                        alt="Profile"
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          e.target.src =
                            "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp";
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-control mt-4">
                    <input
                      type="url"
                      name="profilePicture"
                      value={formData.profilePicture}
                      onChange={handleInputChange}
                      className="input input-bordered input-sm w-full max-w-xs text-base-content"
                      placeholder="Profile picture URL"
                    />
                  </div>
                </div>

                {/* Info Section */}
                <div className="flex-grow">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold text-base-content">First Name</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="input input-bordered w-full text-base-content"
                      />
                    </div>

                    {/* Last Name */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold text-base-content">Last Name</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="input input-bordered w-full text-base-content"
                      />
                    </div>

                    {/* Email */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold text-base-content">Email</span>
                      </label>
                      <input
                        type="email"
                        name="emailId"
                        value={formData.emailId}
                        disabled
                        className="input w-full cursor-not-allowed text-base-content"
                      />
                    </div>

                    {/* Age */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold text-base-content">Age</span>
                      </label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        className="input input-bordered w-full text-base-content"
                        min="1"
                        max="120"
                      />
                    </div>

                    {/* Gender */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold text-base-content">Gender</span>
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="select select-bordered w-full text-base-content"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Monthly Expense */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold text-base-content">Monthly Expense</span>
                      </label>
                      <input
                        type="number"
                        name="monthlyExpense"
                        value={formData.monthlyExpense}
                        onChange={handleInputChange}
                        className="input input-bordered w-full text-base-content"
                      />
                    </div>

                    {/* Weekly Expense */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold text-base-content">Weekly Expense</span>
                      </label>
                      <input
                        type="number"
                        name="weeklyExpense"
                        value={formData.weeklyExpense}
                        onChange={handleInputChange}
                        className="input input-bordered w-full text-base-content"
                      />
                    </div>

                    {/* Member Since */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold text-base-content">Member Since</span>
                      </label>
                      <div className="p-3 bg-base-100 rounded-lg border text-base-content">
                        {new Date(user?.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-3 mt-10">
                    <button
                      className="btn btn-success"
                      onClick={() => setShowConfirmModal(true)}
                      disabled={!hasChanges || isSaving}
                    >
                      {isSaving && (
                        <span className="loading loading-spinner loading-sm mr-2"></span>
                      )}
                      Save Changes
                    </button>
                    <button
                      className="btn btn-error"
                      onClick={handleCancel}
                      disabled={!hasChanges || isSaving}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <dialog open className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg">Confirm Save</h3>
              <p className="py-4">Are you sure you want to save the changes to your profile?</p>
              <div className="modal-action">
                <button
                  className="btn btn-success"
                  onClick={updateProfile}
                  disabled={isSaving}
                >
                  {isSaving && (
                    <span className="loading loading-spinner loading-sm mr-2"></span>
                  )}
                  Yes, Save
                </button>
                <button
                  className="btn btn-error"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSaving}
                >
                  No, Cancel
                </button>
              </div>
            </div>
          </dialog>
        )}
      </div>
    </Curve>
  );
};

export default ProfilePage;
