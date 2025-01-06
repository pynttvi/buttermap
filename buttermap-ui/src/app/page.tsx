// import Image from "next/image";
'use client'
import React, {useEffect, useState} from "react";
import dynamic from "next/dynamic";


const DynamicComponent = dynamic(() => import('./clientOnlyPage'), {ssr: false});


export default function Home() {
    const [clientOnlyState, setClientOnlyState] = useState<string | null>(null);

    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true); // Runs only on the client
    }, []);

    useEffect(() => {
        setClientOnlyState("Client-Side Value"); // Only runs on the client
    }, []);

    return (
        <DynamicComponent/>
    )
}
