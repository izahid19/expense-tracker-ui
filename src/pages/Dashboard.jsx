import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../utils/config";
import { setExpenses } from "../utils/expenseSlice";
import { errorToaster } from "../components/Toaster";
import Curve from "../components/RouteAnimation/Curve";

export default function Dashboard() {
  const dispatch = useDispatch();
  const expenses = useSelector((state) => state.expense.expenses);
  const [filterCategory, setFilterCategory] = useState("All");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const categories = {
    Food: { color: "bg-orange-500", textColor: "text-orange-500", icon: "🍔" },
    Transport: { color: "bg-blue-500", textColor: "text-blue-500", icon: "🚗" },
    Entertainment: { color: "bg-purple-500", textColor: "text-purple-500", icon: "🎬" },
    Shopping: { color: "bg-pink-500", textColor: "text-pink-500", icon: "🛍️" },
    Health: { color: "bg-green-500", textColor: "text-green-500", icon: "🏥" },
    Bills: { color: "bg-red-500", textColor: "text-red-500", icon: "📄" },
    Other: { color: "bg-gray-500", textColor: "text-gray-500", icon: "📦" },
  };

  // Date formatting helper function
  const formatDateTime = (dateString) => {
    if (!dateString) return { date: "N/A", time: "", fullDate: "N/A" };
    
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      fullDate: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    };
  };

  // ✅ Fetch dashboard data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [dashboardRes, expensesRes] = await Promise.all([
          axios.get(`${BASE_URL}/user/dashboard`, { withCredentials: true }),
          axios.get(`${BASE_URL}/user/expenselist`, { withCredentials: true })
        ]);
        
        setDashboardData(dashboardRes.data);
        dispatch(setExpenses(expensesRes.data.expenses || []));
      } catch (err) {
        console.error(err);
        errorToaster("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [dispatch]);

  // Calculate totals from expenses (fallback if no dashboard data)
  const calculateTotal = (itemsArr) =>
    itemsArr.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

  const totalExpenses = calculateTotal(expenses);
  const totalItems = expenses.length;

  // Filtered items for the list view
  const filteredItems =
    filterCategory === "All"
      ? expenses
      : expenses.filter((item) => item.category === filterCategory);

  // Use dashboard data or fallback to frontend calculations
  const monthlyStats = dashboardData?.statistics?.monthly;
  const weeklyStats = dashboardData?.statistics?.weekly;
  const categoryBreakdown = dashboardData?.categoryBreakdown || [];

  // Calculate category totals for dashboard (fallback)
  const frontendCategoryTotals = Object.keys(categories).map(category => {
    const categoryExpenses = expenses.filter(expense => expense.category === category);
    const total = calculateTotal(categoryExpenses);
    const percentage = totalExpenses > 0 ? (total / totalExpenses * 100).toFixed(1) : 0;
    
    return {
      category,
      total,
      percentage,
      count: categoryExpenses.length,
      ...categories[category]
    };
  }).filter(cat => cat.total > 0);

  // Use backend category data or fallback to frontend
  const displayCategoryTotals = categoryBreakdown.length > 0 
    ? categoryBreakdown.map(item => ({
        category: item._id,
        total: item.total,
        count: item.count,
        percentage: totalExpenses > 0 ? (item.total / totalExpenses * 100).toFixed(1) : 0,
        ...categories[item._id] || categories.Other
      }))
    : frontendCategoryTotals;

  // Get recent expenses from dashboard or use first 5 from Redux
  const recentExpenses = dashboardData?.recentExpenses || expenses.slice(0, 5);

  // Get top spending category
  const topCategory = displayCategoryTotals.length > 0 
    ? displayCategoryTotals.reduce((max, category) => category.total > max.total ? category : max)
    : null;

  // Get monthly total from dashboard or calculate
  const monthlyTotal = monthlyStats?.spent || calculateTotal(expenses.filter(expense => {
    if (!expense.date) return false;
    const expenseDate = new Date(expense.date);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  }));

  // Average expense
  const averageExpense = totalItems > 0 ? (totalExpenses / totalItems).toFixed(2) : 0;

  // Budget data from dashboard
  const monthlyBudget = monthlyStats?.budget || dashboardData?.user?.monthlyExpense || 6000;
  const weeklyBudget = weeklyStats?.budget || dashboardData?.user?.weeklyExpense || Math.round(monthlyBudget / 4.33);

  // ✅ PDF Download
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(30, 58, 138);
    doc.text("Expense Tracker Report", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 28, {
      align: "center",
    });

    const tableData = filteredItems.map((item, index) => [
      index + 1,
      item.name,
      item.category,
      `Rs ${item.price}`,
      item.date ? formatDateTime(item.date).fullDate : "N/A",
      item.date ? formatDateTime(item.date).time : "N/A",
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["#", "Item Name", "Category", "Price", "Date", "Time"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [30, 58, 138], textColor: 255 },
      bodyStyles: { fontSize: 10 },
    });

    const finalY = doc.lastAutoTable.finalY || 35;
    const filteredTotal = calculateTotal(filteredItems);
    doc.text(`Total: Rs ${filteredTotal.toFixed(2)}`, 105, finalY + 15, {
      align: "center",
    });
    doc.save(`expenses_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  // Loading state
  if (loading) {
    return (
      <Curve>
        <main className="flex min-h-screen flex-col items-center justify-center sm:p-24 p-4 bg-base-100 text-base-content">
          <div className="text-center">
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <p className="mt-4 text-lg">Loading your dashboard...</p>
          </div>
        </main>
      </Curve>
    );
  }

  return (
    <Curve>
      <main className="flex min-h-screen flex-col items-center justify-between sm:p-24 p-4 bg-base-100 text-base-content transition-colors duration-500">
        <div className="z-10 max-w-6xl w-full font-mono">
          <h1 className="text-4xl p-4 text-center font-bold text-primary mb-8">
            Expense Dashboard
          </h1>

          {/* Budget Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Monthly Budget Card */}
            <div className="bg-base-200 p-6 rounded-xl shadow-lg border-l-4 border-primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-base-content/70">Monthly Budget</p>
                  <h3 className="text-2xl font-bold mt-2">
                    Rs {monthlyStats ? monthlyStats.spent.toFixed(2) : monthlyTotal.toFixed(2)}
                  </h3>
                  <p className="text-xs text-base-content/50 mt-1">
                    of Rs {monthlyBudget}
                    {monthlyStats && (
                      <span className={`ml-2 ${monthlyStats.isOverBudget ? 'text-error' : 'text-success'}`}>
                        ({monthlyStats.isOverBudget ? 'Over' : 'Under'} Budget)
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
              {monthlyStats && (
                <div className="w-full bg-base-300 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${monthlyStats.isOverBudget ? 'bg-error' : 'bg-primary'}`}
                    style={{ width: `${Math.min(monthlyStats.percentageUsed, 100)}%` }}
                  ></div>
                </div>
              )}
            </div>

            {/* Weekly Budget Card */}
            <div className="bg-base-200 p-6 rounded-xl shadow-lg border-l-4 border-secondary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-base-content/70">Weekly Budget</p>
                  <h3 className="text-2xl font-bold mt-2">
                    Rs {weeklyStats ? weeklyStats.spent.toFixed(2) : '0.00'}
                  </h3>
                  <p className="text-xs text-base-content/50 mt-1">
                    of Rs {weeklyBudget}
                    {weeklyStats && (
                      <span className={`ml-2 ${weeklyStats.isOverBudget ? 'text-error' : 'text-success'}`}>
                        ({weeklyStats.isOverBudget ? 'Over' : 'Under'} Budget)
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-3xl">📅</div>
              </div>
              {weeklyStats && (
                <div className="w-full bg-base-300 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${weeklyStats.isOverBudget ? 'bg-error' : 'bg-secondary'}`}
                    style={{ width: `${Math.min(weeklyStats.percentageUsed, 100)}%` }}
                  ></div>
                </div>
              )}
            </div>

            {/* Total Expenses Card */}
            <div className="bg-base-200 p-6 rounded-xl shadow-lg border-l-4 border-accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-base-content/70">Total Expenses</p>
                  <h3 className="text-2xl font-bold mt-2">Rs {totalExpenses.toFixed(2)}</h3>
                </div>
                <div className="text-3xl">📊</div>
              </div>
              <p className="text-xs text-base-content/50 mt-2">{totalItems} total items</p>
            </div>

            {/* Top Category Card */}
            <div className="bg-base-200 p-6 rounded-xl shadow-lg border-l-4 border-info">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-base-content/70">Top Category</p>
                  <h3 className="text-xl font-bold mt-2 capitalize">
                    {topCategory ? topCategory.category : "N/A"}
                  </h3>
                </div>
                <div className="text-3xl">{topCategory ? topCategory.icon : "📈"}</div>
              </div>
              <p className="text-xs text-base-content/50 mt-2">
                {topCategory ? `Rs ${topCategory.total.toFixed(2)}` : "No expenses yet"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Category Breakdown */}
            <div className="bg-base-200 p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold mb-4 text-primary">Category Breakdown</h2>
              <div className="space-y-4">
                {displayCategoryTotals.length > 0 ? (
                  displayCategoryTotals.map((category) => (
                    <div key={category.category} className="flex items-center justify-between p-3 bg-base-300 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{category.icon}</span>
                        <div>
                          <span className="font-semibold capitalize">{category.category}</span>
                          <p className="text-xs text-base-content/50">{category.count} items</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">Rs {category.total.toFixed(2)}</p>
                        <p className="text-xs text-base-content/50">{category.percentage}%</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-base-content/50 py-4">No expenses yet</p>
                )}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-base-200 p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold mb-4 text-primary">Recent Transactions</h2>
              <div className="space-y-3">
                {recentExpenses.length > 0 ? (
                  recentExpenses.map((expense) => {
                    const { date, time } = formatDateTime(expense.date);
                    return (
                      <div key={expense._id} className="flex items-center justify-between p-3 bg-base-300 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className={`w-3 h-3 rounded-full ${categories[expense.category]?.color || categories.Other.color}`}></span>
                          <div>
                            <span className="font-semibold capitalize">{expense.name}</span>
                            <p className="text-xs text-base-content/50 capitalize">{expense.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-error">- Rs {expense.price}</p>
                          <p className="text-xs text-base-content/50">{date} {time}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-base-content/50 py-4">No recent transactions</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-8 bg-base-200 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-primary">Quick Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-base-300 rounded-lg">
                <p className="text-2xl font-bold text-primary">{totalItems}</p>
                <p className="text-sm text-base-content/70">Total Items</p>
              </div>
              <div className="text-center p-4 bg-base-300 rounded-lg">
                <p className="text-2xl font-bold text-secondary">{displayCategoryTotals.length}</p>
                <p className="text-sm text-base-content/70">Categories Used</p>
              </div>
              <div className="text-center p-4 bg-base-300 rounded-lg">
                <p className="text-2xl font-bold text-accent">
                  {monthlyStats ? Math.round(monthlyStats.percentageUsed) : 0}%
                </p>
                <p className="text-sm text-base-content/70">Budget Used</p>
              </div>
              <div className="text-center p-4 bg-base-300 rounded-lg">
                <p className="text-2xl font-bold text-info">
                  {topCategory ? topCategory.percentage + '%' : '0%'}
                </p>
                <p className="text-sm text-base-content/70">Top Category %</p>
              </div>
            </div>
          </div>

          {/* Filter and Expense List Section */}
          <div className="mt-8 bg-base-200 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary">All Expenses</h2>
              <button
                onClick={downloadPDF}
                className="px-4 py-2 bg-success hover:bg-success/90 text-white font-bold rounded"
              >
                📄 Download PDF
              </button>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => setFilterCategory("All")}
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  filterCategory === "All"
                    ? "bg-primary text-white"
                    : "bg-base-300 text-base-content"
                }`}
              >
                All
              </button>
              {Object.entries(categories).map(([category, style]) => (
                <button
                  key={category}
                  onClick={() => setFilterCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    filterCategory === category
                      ? `${style.color} text-white`
                      : "bg-base-300 text-base-content"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Expense List */}
            <ul className="space-y-3">
              {filteredItems.map((item) => {
                const style = categories[item.category] || categories.Other;
                const { date, time } = formatDateTime(item.date);
                return (
                  <li
                    key={item._id}
                    className={`w-full flex justify-between ${style.color} rounded-lg`}
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
                  </li>
                );
              })}
            </ul>

            {/* Total */}
            {filteredItems.length > 0 && (
              <div className="flex justify-between p-3 font-bold text-base-content mt-4 border-t border-base-300">
                <span>
                  Total{" "}
                  {filterCategory !== "All" ? `(${filterCategory})` : ""}
                </span>
                <span>
                  Rs {calculateTotal(filteredItems).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      </main>
    </Curve>
  );
}