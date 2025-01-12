import React from "react";
import {ButtermapState} from "@/app/redux/buttermapState";
import {removeToast, useAppDispatch, useAppSelector} from "@/app/redux/buttermapReducer";

const ToastDisplay: React.FC = () => {
    const toasts = useAppSelector((state: ButtermapState) => state.toasts);
    const dispatch = useAppDispatch();

    const handleRemove = (id: string) => {
        dispatch(removeToast(id));
    };

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 space-y-3 z-50">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`p-4 rounded shadow-lg ${
                        toast.type === "success"
                            ? "bg-green-500 text-white"
                            : toast.type === "error"
                                ? "bg-red-500 text-white"
                                : toast.type === "info"
                                    ? "bg-blue-500 text-white"
                                    : "bg-yellow-500 text-black"
                    }`}
                >
                    <div className="flex justify-between items-center">
                        <span>{toast.message}</span>
                        <button
                            onClick={() => handleRemove(toast.id)}
                            className="ml-4 text-lg font-bold leading-none"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ToastDisplay;
