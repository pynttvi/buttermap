import type {NextConfig} from "next";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config()

const projectRoot = path.resolve(__dirname);
const staticPath = path.join(projectRoot, 'public', 'static');

console.log('Project Root:', projectRoot);
console.log('Static Path:', staticPath);
const isDev = process.env.NODE_ENV === "development"
const nextConfig: NextConfig = {
    output: "export",
    baseUrl: "./",
    reactStrictMode: true,
    experimental: {
        turbo: {
            root: projectRoot
        }
    },
    pageExtensions: ['mdx', 'md', 'jsx', 'js', 'tsx', 'ts'],
};

export default nextConfig;
