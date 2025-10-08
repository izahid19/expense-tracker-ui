import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Curve from "../components/RouteAnimation/Curve";
import { BASE_URL } from "../utils/config";
import {
  setExpenses,
  addExpense,
  removeUserExpense,
} from "../utils/expenseSlice";
import { successToaster, errorToaster } from "../components/Toaster";

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const expenses = useSelector((state) => state.expense.expenses);
  const user = useSelector((state) => state.user);

  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    category: "Food",
  });

  const [budgetData, setBudgetData] = useState({
    monthly: { spent: 0, budget: user?.monthlyExpense || 10000, percentage: 0 },
    weekly: { spent: 0, budget: user?.weeklyExpense || 2500, percentage: 0 },
  });

  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

  const categories = {
    Food: { color: "bg-orange-500", textColor: "text-orange-500" },
    Transport: { color: "bg-blue-500", textColor: "text-blue-500" },
    Entertainment: { color: "bg-purple-500", textColor: "text-purple-500" },
    Shopping: { color: "bg-pink-500", textColor: "text-pink-500" },
    Health: { color: "bg-green-500", textColor: "text-green-500" },
    Bills: { color: "bg-red-500", textColor: "text-red-500" },
    Other: { color: "bg-gray-500", textColor: "text-gray-500" },
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return { date: "N/A", time: "" };

    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  useEffect(() => {
    if (!user || !user._id) return;

    const fetchExpenses = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/user/expenselist`, {
          withCredentials: true,
        });
        dispatch(setExpenses(res.data.expenses || []));
        calculateBudgetData(res.data.expenses || []);
      } catch (err) {
        console.error(err);
        errorToaster("Failed to load expenses");
      }
    };

    fetchExpenses();
  }, [dispatch, user]);

  const calculateBudgetData = (expensesList) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyExpenses = expensesList.filter((expense) => {
      if (!expense.date) return false;
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    });
    const monthlySpent = calculateTotal(monthlyExpenses);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weeklyExpenses = expensesList.filter((expense) => {
      if (!expense.date) return false;
      const expenseDate = new Date(expense.date);
      return expenseDate >= startOfWeek && expenseDate <= endOfWeek;
    });
    const weeklySpent = calculateTotal(weeklyExpenses);

    const monthlyBudget = user?.monthlyExpense || 10000;
    const weeklyBudget =
      user?.weeklyExpense || Math.round(monthlyBudget / 4.33);

    setBudgetData({
      monthly: {
        spent: monthlySpent,
        budget: monthlyBudget,
        percentage:
          monthlyBudget > 0 ? (monthlySpent / monthlyBudget) * 100 : 0,
      },
      weekly: {
        spent: weeklySpent,
        budget: weeklyBudget,
        percentage: weeklyBudget > 0 ? (weeklySpent / weeklyBudget) * 100 : 0,
      },
    });
  };

  const calculateTotal = (itemsArr) =>
    itemsArr.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

  const total = calculateTotal(expenses);

  const addItem = async (e) => {
    e.preventDefault();

    if (!user || !user._id) {
      errorToaster("Please login first");
      navigate("/login");
      return;
    }

    if (!newItem.name || !newItem.price) {
      return errorToaster("Please fill all fields");
    }

    try {
      const res = await axios.post(
        `${BASE_URL}/user/addexpense`,
        {
          name: newItem.name,
          price: newItem.price,
          category: newItem.category,
        },
        { withCredentials: true }
      );

      const savedExpense = res.data.data;
      dispatch(addExpense(savedExpense));
      successToaster("Expense added!");
      setNewItem({ name: "", price: "", category: "Food" });
      calculateBudgetData([...expenses, savedExpense]);
    } catch (err) {
      console.error(err);
      errorToaster("Failed to add expense");
    }
  };

  const deleteItem = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/user/deleteexpense/${id}`, {
        withCredentials: true,
      });
      dispatch(removeUserExpense(id));
      successToaster("Expense deleted");
      const updatedExpenses = expenses.filter((expense) => expense._id !== id);
      calculateBudgetData(updatedExpenses);
      setDeleteModal({ open: false, id: null });
    } catch (err) {
      console.error(err);
      errorToaster("Failed to delete");
    }
  };

  return (
    <Curve>
      <main className="flex min-h-screen flex-col items-center justify-between sm:p-24 p-4 bg-base-100 text-base-content transition-colors duration-500">
        <div className="z-10 max-w-5xl w-full font-mono">
          <h1 className="text-4xl p-4 text-center font-bold text-primary">
            Expense Tracker
          </h1>

          {/* Expense List */}
          <div className="bg-base-200 p-4 rounded-lg shadow-lg">
            <form
              onSubmit={addItem}
              className="grid grid-cols-12 gap-2 items-center"
            >
              <input
                className="col-span-12 sm:col-span-4 p-3 border rounded bg-base-100 text-base-content"
                type="text"
                placeholder="Enter Item"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
              />
              <select
                className="col-span-6 sm:col-span-3 p-3 border rounded bg-base-100 text-base-content"
                value={newItem.category}
                onChange={(e) =>
                  setNewItem({ ...newItem, category: e.target.value })
                }
              >
                {Object.keys(categories).map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
              <input
                className="col-span-6 sm:col-span-3 p-3 border rounded bg-base-100 text-base-content"
                type="number"
                placeholder="Price"
                value={newItem.price}
                onChange={(e) =>
                  setNewItem({ ...newItem, price: e.target.value })
                }
              />
              <button
                type="submit"
                className="col-span-12 sm:col-span-2 text-white bg-primary hover:bg-primary/90 p-3 text-xl rounded"
              >
                Add
              </button>
            </form>

            <ul className="mt-4">
              {expenses.map((item) => {
                const style = categories[item.category] || categories.Other;
                const { date, time } = formatDateTime(item.date);
                return (
                  <li
                    key={item._id}
                    className={`my-4 w-full flex justify-between ${style.color} rounded-lg`}
                  >
                    <div className="p-4 w-full flex flex-col md:flex-row justify-between font-bold text-white">
                      <div className="flex flex-col">
                        <span className="capitalize">{item.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs opacity-90 capitalize">
                            {item.category}
                          </span>
                          <span className="text-xs opacity-70">•</span>
                          <span className="text-xs opacity-70">{date}</span>
                          <span className="text-xs opacity-70">{time}</span>
                        </div>
                      </div>
                      <span className="flex items-center justify-start md:justify-center text-lg md:text-2xl">
                        Rs {item.price}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setDeleteModal({ open: true, id: item._id })
                      }
                      className="ml-1 md:ml-8 p-4 border-l-2 border-white/20 hover:bg-black/20 w-16 font-bold text-white rounded-r-lg"
                    >
                      X
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Total */}
            {expenses.length > 0 && (
              <div className="flex justify-between p-3 font-bold text-base-content border-t border-base-300">
                <span>Total Expenses</span>
                <span>Rs {total.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Category Label */}
          {expenses.length > 0 && (
            <h2 className="text-xl font-semibold mt-4 mb-2">Categories</h2>
          )}
          {/* Category Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {Object.entries(categories).map(([category, style]) => {
              const totalForCat = calculateTotal(
                expenses.filter((e) => e.category === category)
              );
              return totalForCat > 0 ? (
                <div
                  key={category}
                  className="bg-base-200 p-3 rounded-lg text-center"
                >
                  <div className={`text-xs font-semibold ${style.textColor}`}>
                    {category}
                  </div>
                  <div className="text-sm font-bold">Rs {totalForCat}</div>
                </div>
              ) : null;
            })}
          </div>

          {/* 💰 Budget Summary (Monthly + Weekly) */}
          <h2 className="text-xl font-semibold mb-2">Budget Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Monthly Budget Card */}
            <div className="bg-base-200 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-primary mb-2">
                Monthly Budget
              </h3>
              <p>
                <strong>Spent:</strong> Rs {budgetData.monthly.spent.toFixed(2)}
              </p>
              <p>
                <strong>Budget:</strong> Rs {budgetData.monthly.budget}
              </p>
              <p>
                <strong>Left:</strong> Rs{" "}
                {Math.max(
                  budgetData.monthly.budget - budgetData.monthly.spent,
                  0
                ).toFixed(2)}
              </p>
              <div className="w-full bg-base-300 h-3 rounded-full mt-2">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-500"
                  style={{ width: `${budgetData.monthly.percentage}%` }}
                ></div>
              </div>
              <p className="text-sm mt-1">
                {budgetData.monthly.percentage.toFixed(1)}% used
              </p>
            </div>

            {/* Weekly Budget Card */}
            <div className="bg-base-200 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-secondary mb-2">
                Weekly Budget
              </h3>
              <p>
                <strong>Spent:</strong> Rs {budgetData.weekly.spent.toFixed(2)}
              </p>
              <p>
                <strong>Budget:</strong> Rs {budgetData.weekly.budget}
              </p>
              <p>
                <strong>Left:</strong> Rs{" "}
                {Math.max(
                  budgetData.weekly.budget - budgetData.weekly.spent,
                  0
                ).toFixed(2)}
              </p>
              <div className="w-full bg-base-300 h-3 rounded-full mt-2">
                <div
                  className="bg-secondary h-3 rounded-full transition-all duration-500"
                  style={{ width: `${budgetData.weekly.percentage}%` }}
                ></div>
              </div>
              <p className="text-sm mt-1">
                {budgetData.weekly.percentage.toFixed(1)}% used
              </p>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {deleteModal.open && (
            <div className="modal modal-open">
              <div className="modal-box w-96 max-w-full">
                <h3 className="font-bold text-lg text-center">
                  Are you sure you want to delete this?
                </h3>
                <p className="py-4 text-center">
                  This action cannot be undone.
                </p>
                <div className="modal-action justify-center gap-4">
                  <button
                    className="btn btn-error w-28"
                    onClick={() => deleteItem(deleteModal.id)}
                  >
                    Yes
                  </button>
                  <button
                    className="btn btn-outline w-28"
                    onClick={() => setDeleteModal({ open: false, id: null })}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </Curve>
  );
}
