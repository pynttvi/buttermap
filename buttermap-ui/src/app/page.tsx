// import Image from "next/image";
'use client'
import React from "react";
import dynamic from "next/dynamic";
import NonClientOnlyPage from "@/app/nonClientOnlyPage";


const DynamicComponent = dynamic(() => import('./clientOnlyPage'), {ssr: false});

const isDev = process.env.NODE_ENV === "development";

export default function Home() {
    return (
        <>
            {!isDev && <DynamicComponent/>}
            {isDev && <NonClientOnlyPage/>}
        </>
    )
}
