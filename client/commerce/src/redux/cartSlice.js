import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { axiosInstance } from '../axiosCalls/axios.js';

const initialState = {
    cartItems : [],
    loading : false,     // add-to-cart in flight (used by ProductDetails)
    fetching : false,    // GET /cart in flight
    hydrated : false,    // true once the cart has been loaded from the server
    pendingOps : 0,      // in-flight update/remove requests (optimistic updates)
    error : null,
}

/* Accepts { cart: [...] }, { cart: { items: [...] } } or { items: [...] } */
const pickCart = (data) => {
    const raw = data?.cart ?? data?.items ?? []
    return Array.isArray(raw) ? raw : raw.items ?? []
}

const idOf = (i) => i?.product?._id ?? i?.product ?? i?._id

export const addToCart = createAsyncThunk(
    "cart/addToCart",
    async (productId) => {
        const response = await axiosInstance.post(`/cart/${productId}`)
        return pickCart(response.data)
    }
)

export const fetchCart = createAsyncThunk(
    "cart/fetchCart",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('/cart')
            return pickCart(response.data)
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.message ||
                (err.response?.status === 401 ? 'Please sign in to view your bag.' : err.message)
            )
        }
    }
)

/* PATCH /cart/:productId { quantity }, then re-fetch so products come back populated */
export const updateCartItem = createAsyncThunk(
    "cart/updateCartItem",
    async ({ productId, quantity }) => {
        await axiosInstance.patch(`/cart/${productId}`, { quantity })
        const response = await axiosInstance.get('/cart')
        return pickCart(response.data)
    }
)

/* DELETE /cart/:productId, then re-fetch */
export const removeFromCart = createAsyncThunk(
    "cart/removeFromCart",
    async (productId) => {
        await axiosInstance.delete(`/cart/${productId}`)
        const response = await axiosInstance.get('/cart')
        return pickCart(response.data)
    }
)

const cartSlice = createSlice({
    name : "cart",
    initialState,
    reducers : {
        setCart : (state,action) => {
            state.cartItems = action.payload
        },
        // Instant UI changes; the server response reconciles afterwards.
        optimisticQty : (state, { payload: { productId, quantity } }) => {
            const item = state.cartItems.find((i) => idOf(i) === productId)
            if (item) item.quantity = quantity
        },
        optimisticRemove : (state, { payload: productId }) => {
            state.cartItems = state.cartItems.filter((i) => idOf(i) !== productId)
        },
    },
    extraReducers: (builder) => {
    builder
        .addCase(addToCart.pending, (state) => {
            state.loading = true
            state.error = null
        })
        .addCase(addToCart.fulfilled, (state, action) => {
            state.loading = false
            state.cartItems = action.payload
        })
        .addCase(addToCart.rejected, (state, action) => {
            state.loading = false
            state.error = action.error.message
        })

        .addCase(fetchCart.pending, (state) => {
            state.fetching = true
            state.error = null
        })
        .addCase(fetchCart.fulfilled, (state, action) => {
            state.fetching = false
            state.hydrated = true
            state.cartItems = action.payload
        })
        .addCase(fetchCart.rejected, (state, action) => {
            state.fetching = false
            state.hydrated = true
            state.error = action.payload || action.error.message
        })

        // Only the LAST in-flight request applies the server's cart,
        // so rapid clicks don't flicker back to stale numbers.
        .addCase(updateCartItem.pending, (state) => { state.pendingOps += 1 })
        .addCase(updateCartItem.fulfilled, (state, action) => {
            state.pendingOps = Math.max(0, state.pendingOps - 1)
            if (state.pendingOps === 0) state.cartItems = action.payload
        })
        .addCase(updateCartItem.rejected, (state) => {
            state.pendingOps = Math.max(0, state.pendingOps - 1)
        })

        .addCase(removeFromCart.pending, (state) => { state.pendingOps += 1 })
        .addCase(removeFromCart.fulfilled, (state, action) => {
            state.pendingOps = Math.max(0, state.pendingOps - 1)
            if (state.pendingOps === 0) state.cartItems = action.payload
        })
        .addCase(removeFromCart.rejected, (state) => {
            state.pendingOps = Math.max(0, state.pendingOps - 1)
        })
}
})


export const { setCart, optimisticQty, optimisticRemove } = cartSlice.actions

export default cartSlice.reducer