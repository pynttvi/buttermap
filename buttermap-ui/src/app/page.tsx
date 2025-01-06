// import Image from "next/image";
'use client'
import React from "react";
import {MainContent} from "@/app/mainContent";
import buttermapStore from "@/app/redux/buttermapStore";
import {Provider} from "react-redux";


export default function Home() {
    return (
        <Provider store={buttermapStore}>
            <MainContent />
        </Provider>
    )
}
