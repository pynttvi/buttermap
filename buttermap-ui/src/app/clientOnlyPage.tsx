// import Image from "next/image";
'use client'
import React from "react";
import buttermapStore from "@/app/redux/buttermapStore";
import {Provider} from "react-redux";
import Index from "@/app/index";


export default function ClientOnlyPage() {
    return (
        <Provider store={buttermapStore}>
            <Index />
        </Provider>
    )
}
