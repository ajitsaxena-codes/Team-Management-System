import { createSlice } from "@reduxjs/toolkit";

const UserSlice = createSlice({
    name : "User",
    initialState : null,
    reducers : {
        addUserData : (state, action) =>
        {
            return action.payload
        },
        removeUserData : () =>
        {
            return null
        }
    }
})


export const{ addUserData, removeUserData } = UserSlice.actions
export default UserSlice.reducer