'use client'
import { productsDummyData, userDummyData } from "@/assets/assets";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const useAppContext = () => {
    return useContext(AppContext)
}

export const AppContextProvider = (props) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY
    const router = useRouter()
    const {user} = useUser()
    const {getToken} = useAuth()

    const [products, setProducts] = useState([])
    const [userData, setUserData] = useState(false)
    const [isSeller, setIsSeller] = useState(false)
    const [cartItems, setCartItems] = useState({})

    const fetchProductData = async () => {
    try {
      const{data}  = await axios.get('/api/product/list')
      if (data.success) {
        setProducts(data.products)
        
      }else{
        toast.error(message.error)
      }


    } catch (error) {
        toast.error(message.error)
    }
    }






    const fetchUserData = async () => {
        try {
             if (user.publicMetadata.role === 'seller') {
                 setIsSeller(true);
             }
     
             const token = await getToken();
             
     
             const { data } = await axios.get('/api/user/data', {
                 headers: {
                     Authorization: `Bearer ${token}` // ✅ Fixed space issue
                 }
             });
     
             
     
             if (data.success) {
                 setUserData(data.user);
                 setCartItems(data.user.cartItems);
             } else {
                 toast.error(data.message);
             }
     
        } catch (error) {
             
             toast.error(error.message);
        }
     };
     






     const addToCart = async (itemId) => {
        let cartData = structuredClone(cartItems);
        cartData[itemId] = (cartData[itemId] || 0) + 1;
        setCartItems(cartData);
    
        if (user) {
            try {
                const token = await getToken();
                const res = await axios.post("/api/cart/update", { cartData }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
    
                const { action } = res.data;
                toast.success(action === "added" ? "Item added to cart!" : "Cart updated!");
    
            } catch (error) {
                toast.error(error.message);
            }
        }
    }
    

    const updateCartQuantity = async (itemId, quantity) => {
        let cartData = structuredClone(cartItems);
        if (quantity === 0) {
            delete cartData[itemId];
        } else {
            cartData[itemId] = quantity;
        }
        setCartItems(cartData);
    
        if (user) {
            try {
                const token = await getToken();
                const res = await axios.post("/api/cart/update", { cartData }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
    
                const { action } = res.data;
                toast.success(action === "updated" ? "Cart updated!" : "Item added to cart!");
    
            } catch (error) {
                toast.error(error.message);
            }
        }
    }
    

    const getCartCount = () => {
        let totalCount = 0;
        for (const items in cartItems) {
            if (cartItems[items] > 0) {
                totalCount += cartItems[items];
            }
        }
        return totalCount;
    }

    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            if (cartItems[items] > 0) {
                totalAmount += itemInfo.offerPrice * cartItems[items];
            }
        }
        return Math.floor(totalAmount * 100) / 100;
    }

    useEffect(() => {
        fetchProductData()
    }, [])

    useEffect(() => {
        if (user) {
            fetchUserData() 
        }
        
    }, [user])

    const value = {user,
        currency, router,
        isSeller, setIsSeller,
        userData, fetchUserData,
        products, fetchProductData,
        cartItems, setCartItems,
        addToCart, updateCartQuantity,
        getCartCount, getCartAmount, getToken
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}