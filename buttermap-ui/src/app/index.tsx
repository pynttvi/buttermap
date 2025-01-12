// pages/_app.js or pages/_app.tsx
import Head from 'next/head';
import {MainContent} from "@/app/mainContent";

function Index() {
    return (
        <>
            <Head>
                <title>
                    Buttermap
                </title>
                <link rel="icon" href="/buttermap.ico?v=2"/>
            </Head>
            <MainContent/>
        </>
    );
}

export default Index;