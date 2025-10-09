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
  
  // Filter states
  const [filterType, setFilterType] = useState("current_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  
  const [filterCategory, setFilterCategory] = useState("All");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const categories = {
    Food: { color: "bg-orange-500", textColor: "text-orange-500", icon: "🍔" },
    Groceries: { color: "bg-yellow-500", textColor: "text-yellow-500", icon: "🛒" },
    Transport: { color: "bg-blue-500", textColor: "text-blue-500", icon: "🚗" },
    Entertainment: { color: "bg-purple-500", textColor: "text-purple-500", icon: "🎬" },
    Shopping: { color: "bg-pink-500", textColor: "text-pink-500", icon: "🛍️" },
    Health: { color: "bg-green-500", textColor: "text-green-500", icon: "🏥" },
    Bills: { color: "bg-red-500", textColor: "text-red-500", icon: "📄" },
    Education: { color: "bg-indigo-500", textColor: "text-indigo-500", icon: "📚" },
    Travel: { color: "bg-cyan-500", textColor: "text-cyan-500", icon: "✈️" },
    Utilities: { color: "bg-amber-500", textColor: "text-amber-500", icon: "💡" },
    Rent: { color: "bg-rose-500", textColor: "text-rose-500", icon: "🏠" },
    Insurance: { color: "bg-teal-500", textColor: "text-teal-500", icon: "🛡️" },
    Fitness: { color: "bg-lime-500", textColor: "text-lime-500", icon: "💪" },
    Gifts: { color: "bg-fuchsia-500", textColor: "text-fuchsia-500", icon: "🎁" },
    "Personal Care": { color: "bg-violet-500", textColor: "text-violet-500", icon: "💅" },
    "Pet Care": { color: "bg-emerald-500", textColor: "text-emerald-500", icon: "🐾" },
    "Home Maintenance": { color: "bg-stone-500", textColor: "text-stone-500", icon: "🔧" },
    Subscriptions: { color: "bg-sky-500", textColor: "text-sky-500", icon: "📱" },
    "Dining Out": { color: "bg-orange-600", textColor: "text-orange-600", icon: "🍽️" },
    Investment: { color: "bg-green-600", textColor: "text-green-600", icon: "📈" },
    Savings: { color: "bg-emerald-600", textColor: "text-emerald-600", icon: "💰" },
    Charity: { color: "bg-red-400", textColor: "text-red-400", icon: "❤️" },
    Other: { color: "bg-gray-500", textColor: "text-gray-500", icon: "📦" },
  };

  const filterOptions = [
    { value: "current_month", label: "Current Month", icon: "📅" },
    { value: "last_month", label: "Last Month", icon: "📆" },
    { value: "current_week", label: "Current Week", icon: "📍" },
    { value: "last_week", label: "Last Week", icon: "⏮️" },
    { value: "current_year", label: "Current Year", icon: "📊" },
    { value: "last_year", label: "Last Year", icon: "📉" },
    { value: "custom", label: "Custom Range", icon: "🔧" },
  ];

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

  // ✅ Fetch dashboard data from backend with filters
  useEffect(() => {
    fetchDashboardData();
  }, [dispatch, filterType, customStartDate, customEndDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Build URL with filter parameters
      let dashboardUrl = `${BASE_URL}/user/dashboard?filterType=${filterType}`;
      let expensesUrl = `${BASE_URL}/user/expenselist?filterType=${filterType}`;
      
      if (filterType === 'custom' && customStartDate && customEndDate) {
        dashboardUrl += `&customStartDate=${customStartDate}&customEndDate=${customEndDate}`;
        expensesUrl += `&customStartDate=${customStartDate}&customEndDate=${customEndDate}`;
      }

      const [dashboardRes, expensesRes] = await Promise.all([
        axios.get(dashboardUrl, { withCredentials: true }),
        axios.get(expensesUrl, { withCredentials: true })
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

  const handleFilterChange = (newFilter) => {
    setFilterType(newFilter);
    if (newFilter === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
      setCustomStartDate("");
      setCustomEndDate("");
    }
  };

  const applyCustomDateFilter = () => {
    if (customStartDate && customEndDate) {
      fetchDashboardData();
    } else {
      errorToaster("Please select both start and end dates");
    }
  };

  // Calculate totals from expenses
  const calculateTotal = (itemsArr) =>
    itemsArr.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

  const totalExpenses = calculateTotal(expenses);
  const totalItems = expenses.length;

  // Filtered items for category filter (separate from date filter)
  const filteredItems =
    filterCategory === "All"
      ? expenses
      : expenses.filter((item) => item.category === filterCategory);

  // Use dashboard data
  const monthlyStats = dashboardData?.statistics?.monthly;
  const weeklyStats = dashboardData?.statistics?.weekly;
  const filteredMonthlyStats = dashboardData?.statistics?.filteredMonthly;
  const filteredWeeklyStats = dashboardData?.statistics?.filteredWeekly;
  const categoryBreakdown = dashboardData?.categoryBreakdown || [];
  const filteredData = dashboardData?.filteredData || {};

  // Use backend category data - these are already filtered by the selected period
  const displayCategoryTotals = categoryBreakdown.map(item => ({
    category: item._id,
    total: item.total,
    count: item.count,
    percentage: filteredData.totalSpent > 0 ? ((item.total / filteredData.totalSpent) * 100).toFixed(1) : 0,
    ...categories[item._id] || categories.Other
  }));

  // Get recent expenses - should show from filtered period
  const recentExpenses = filteredData.expenses?.slice(0, 5) || [];

  // Get top spending category
  const topCategory = displayCategoryTotals.length > 0 
    ? displayCategoryTotals.reduce((max, category) => category.total > max.total ? category : max)
    : null;

  // Budget data - use filtered stats if available
  const displayMonthlyStats = filteredMonthlyStats || monthlyStats;
  const displayWeeklyStats = filteredWeeklyStats || weeklyStats;
  
  const monthlyBudget = displayMonthlyStats?.budget || dashboardData?.user?.monthlyExpense || 6000;
  const weeklyBudget = displayWeeklyStats?.budget || dashboardData?.user?.weeklyExpense || Math.round(monthlyBudget / 4.33);

  // ✅ PDF Download with filtered data
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(30, 58, 138);
    doc.text("Expense Tracker Report", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Period: ${filteredData.dateRange?.label || 'All Time'}`, 105, 28, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 35, { align: "center" });

    const tableData = filteredItems.map((item, index) => [
      index + 1,
      item.name,
      item.category,
      `Rs ${item.price}`,
      item.date ? formatDateTime(item.date).fullDate : "N/A",
      item.date ? formatDateTime(item.date).time : "N/A",
    ]);

    autoTable(doc, {
      startY: 42,
      head: [["#", "Item Name", "Category", "Price", "Date", "Time"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [30, 58, 138], textColor: 255 },
      bodyStyles: { fontSize: 10 },
    });

    const finalY = doc.lastAutoTable.finalY || 42;
    const filteredTotal = calculateTotal(filteredItems);
    doc.text(`Total: Rs ${filteredTotal.toFixed(2)}`, 105, finalY + 15, {
      align: "center",
    });
    
    const fileName = filteredData.dateRange?.label 
      ? `expenses_${filteredData.dateRange.label.replace(/\s+/g, '_')}.pdf`
      : `expenses_${new Date().toISOString().split("T")[0]}.pdf`;
    
    doc.save(fileName);
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

          {/* Date Filter Section */}
          <div className="bg-base-200 p-6 rounded-xl shadow-lg mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🔍</span>
              <h2 className="text-xl font-bold text-primary">Filter by Period</h2>
            </div>
            
            <div className="flex flex-wrap gap-3 mb-4">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange(option.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    filterType === option.value
                      ? "bg-primary text-white shadow-md scale-105"
                      : "bg-base-300 text-base-content hover:bg-base-300/70"
                  }`}
                >
                  <span className="mr-2">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>

            {/* Custom Date Picker */}
            {showCustomDatePicker && (
              <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/30">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-base-content mb-2">Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-base-300 rounded-lg bg-base-100 text-base-content focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-base-content mb-2">End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-4 py-2 border border-base-300 rounded-lg bg-base-100 text-base-content focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={applyCustomDateFilter}
                    className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            )}

            {/* Current Filter Display */}
            <div className="mt-4 p-3 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg">
              <p className="text-sm font-medium text-base-content">
                📍 Showing data for: <span className="font-bold text-primary">{filteredData.dateRange?.label || "Loading..."}</span>
              </p>
              {filteredData.totalSpent !== undefined && (
                <p className="text-xs text-base-content/70 mt-1">
                  Total: Rs {filteredData.totalSpent.toFixed(2)} • {filteredData.expenseCount} transactions
                </p>
              )}
            </div>
          </div>

          {/* Budget Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Filtered Period Total Card */}
            <div className="bg-base-200 p-6 rounded-xl shadow-lg border-l-4 border-accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-base-content/70">Period Total</p>
                  <h3 className="text-2xl font-bold mt-2">
                    Rs {filteredData.totalSpent?.toFixed(2) || '0.00'}
                  </h3>
                  <p className="text-xs text-base-content/50 mt-1">
                    {filteredData.expenseCount || 0} transactions
                  </p>
                </div>
                <div className="text-3xl">💸</div>
              </div>
            </div>

            {/* Monthly Budget Card */}
            <div className="bg-base-200 p-6 rounded-xl shadow-lg border-l-4 border-primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-base-content/70">Monthly Budget</p>
                  <h3 className="text-2xl font-bold mt-2">
                    Rs {displayMonthlyStats ? displayMonthlyStats.spent.toFixed(2) : '0.00'}
                  </h3>
                  <p className="text-xs text-base-content/50 mt-1">
                    of Rs {monthlyBudget}
                    {displayMonthlyStats && displayMonthlyStats.budget > 0 && (
                      <span className={`ml-2 ${displayMonthlyStats.isOverBudget ? 'text-error' : 'text-success'}`}>
                        ({displayMonthlyStats.isOverBudget ? 'Over' : 'Under'} Budget)
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
              {displayMonthlyStats && (
                <div className="w-full bg-base-300 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${displayMonthlyStats.isOverBudget ? 'bg-error' : 'bg-primary'}`}
                    style={{ width: `${Math.min(displayMonthlyStats.percentageUsed || 0, 100)}%` }}
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
                    Rs {displayWeeklyStats ? displayWeeklyStats.spent.toFixed(2) : '0.00'}
                  </h3>
                  <p className="text-xs text-base-content/50 mt-1">
                    of Rs {weeklyBudget}
                    {displayWeeklyStats && displayWeeklyStats.budget > 0 && (
                      <span className={`ml-2 ${displayWeeklyStats.isOverBudget ? 'text-error' : 'text-success'}`}>
                        ({displayWeeklyStats.isOverBudget ? 'Over' : 'Under'} Budget)
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-3xl">📅</div>
              </div>
              {displayWeeklyStats && (
                <div className="w-full bg-base-300 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${displayWeeklyStats.isOverBudget ? 'bg-error' : 'bg-secondary'}`}
                    style={{ width: `${Math.min(displayWeeklyStats.percentageUsed || 0, 100)}%` }}
                  ></div>
                </div>
              )}
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
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {displayCategoryTotals.length > 0 ? (
                  displayCategoryTotals.map((category) => (
                    <div key={category.category} className="flex items-center justify-between p-3 bg-base-300 rounded-lg hover:shadow-md transition-shadow">
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
                  <p className="text-center text-base-content/50 py-4">No expenses in this period</p>
                )}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-base-200 p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold mb-4 text-primary">Recent Transactions</h2>
              <div className="space-y-3">
                {recentExpenses.length > 0 ? (
                  recentExpenses.map((expense) => {
                    const style = categories[expense.category] || categories.Other;
                    const { date, time } = formatDateTime(expense.date);
                    return (
                      <div key={expense._id} className="flex items-center justify-between p-3 bg-base-300 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{style.icon}</span>
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
                  {displayMonthlyStats ? Math.round(displayMonthlyStats.percentageUsed) : 0}%
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

            {/* Category Filter Buttons */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => setFilterCategory("All")}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
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
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                    filterCategory === category
                      ? `${style.color} text-white`
                      : "bg-base-300 text-base-content"
                  }`}
                >
                  {style.icon} {category}
                </button>
              ))}
            </div>

            {/* Expense List */}
            <ul className="space-y-3">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const style = categories[item.category] || categories.Other;
                  const { date, time } = formatDateTime(item.date);
                  return (
                    <li
                      key={item._id}
                      className={`w-full flex justify-between ${style.color} rounded-lg`}
                    >
                      <div className="p-4 w-full flex flex-col md:flex-row justify-between font-bold text-white">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-2">
                            <span className="text-lg">{style.icon}</span>
                            <span className="capitalize">{item.name}</span>
                          </span>
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
                })
              ) : (
                <p className="text-center text-base-content/50 py-8">No expenses found for this period</p>
              )}
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