import React from "react";

interface ToggleButtonProps {
    label: string
    state: boolean
    setState: (state: boolean) => void
}

const ToggleButton: React.FC<ToggleButtonProps> = ({state, setState, label}) => {

    return (
        <div className="flex w-full">
            <span className="mr-4 text-amber-700 w-20">{label}</span>
            <button
                onClick={() => setState(!state)}
                className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors ${
                    state ? "bg-green-500" : "bg-gray-300"
                }`}
            >
        <span
            className={`absolute left-1 w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                state ? "translate-x-6" : ""
            }`}
        ></span>
            </button>
        </div>
    );
};

export default ToggleButton;