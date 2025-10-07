import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice"
import expenseReducer from "./expenseSlice"


const appStore = configureStore({
    reducer: {
        user: userReducer,
        expense: expenseReducer,
    }
});

export default appStore