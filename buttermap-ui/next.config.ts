import type {NextConfig} from "next";
import dotenv from 'dotenv';

dotenv.config()

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
    ...(isProduction ? {output: "export"} : {}),
    reactStrictMode: true,
    basePath: isProduction ? '/buttermap' : '',
    assetPrefix: isProduction ? '/buttermap' : '',
};

export default nextConfig;
