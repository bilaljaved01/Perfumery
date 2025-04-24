import connectDB from "@/config/db";
import User from "@/models/User";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = getAuth(request); // FIXED: now calling getAuth properly
        const { cartData } = await request.json();

        await connectDB();
        const user = await User.findById(userId);

        const previousCart = user.cartItems || {};
        let action = "added"; // default assumption

        for (const itemId in cartData) {
            if (previousCart[itemId]) {
                if (cartData[itemId] !== previousCart[itemId]) {
                    action = "updated"; // quantity changed
                }
            }
        }

        // You can also check if a new item was added
        const newItems = Object.keys(cartData).filter(id => !previousCart[id]);
        if (newItems.length > 0) {
            action = "added";
        }

        user.cartItems = cartData;
        await user.save();

        return NextResponse.json({ success: true, action });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}
