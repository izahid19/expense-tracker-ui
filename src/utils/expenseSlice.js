import { createSlice } from "@reduxjs/toolkit";

const expenseSlice = createSlice({
  name: "expense",
  initialState: {
    expenses: [],
  },
  reducers: {
    // Replace all expenses (used after fetching)
    setExpenses: (state, action) => {
      state.expenses = action.payload;
    },

    // Add one expense
    addExpense: (state, action) => {
      state.expenses.push(action.payload);
    },

    // Remove one expense by ID
    removeUserExpense: (state, action) => {
      state.expenses = state.expenses.filter(
        (expense) => expense._id !== action.payload
      );
    },
  },
});

export const { setExpenses, addExpense, removeUserExpense } =
  expenseSlice.actions;
export default expenseSlice.reducer;
