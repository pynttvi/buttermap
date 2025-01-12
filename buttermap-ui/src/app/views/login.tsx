import React, {useState} from "react";
import Item from "@/app/components/item";
import {fetchData} from "@/app/service/common";
import {setPersistedData, useAppDispatch} from "@/app/redux/buttermapReducer";


const LoginComponent: React.FC = () => {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string>("");
    const dispatch = useAppDispatch()


    const handleLogin = () => {
        if (!username || !password) {
            setError("Please enter both username and password.");
            return;
        }
        const token = btoa(`${username}:${password}`); // Encode to Base64

        fetchData(token).then((data) => {
            localStorage.setItem(
                "auth",
                JSON.stringify({username, token: token})
            );
            if (data) {
                dispatch(setPersistedData(data))
            }
            setError("");
            console.log("Login successful!");
        }).catch((reason) => {
            console.error(reason)
            setError("Invalid username or password.");
        })
    };

    return (
        <Item>
            <h2 className="text-2xl font-bold text-center">Login</h2>
            {error && (
                <div className="text-sm text-red-500 bg-red-900 p-2 rounded">
                    {error}
                </div>
            )}
            <form>
                <div className="space-y-2">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring focus:ring-blue-500"
                    />
                </div>
                <div className="space-y-2">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring focus:ring-blue-500"
                    />
                </div>
                <button
                    onClick={handleLogin}
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300"
                >
                    Login
                </button>
                <p>Tell me !!buttermap and I give you password day or night</p>
            </form>
        </Item>
    );
};

export default LoginComponent;
