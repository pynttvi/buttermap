// import Image from "next/image";
'use client'
import React from "react";
import buttermapStore from "@/app/redux/buttermapStore";
import {Provider} from "react-redux";
import {MainContent} from "@/app/mainContent";


export default function ClientOnlyPage() {
    return (
        <Provider store={buttermapStore}>
            <MainContent/>
        </Provider>
    )
}
