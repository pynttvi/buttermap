import React from "react";

interface LabeledButtonProps {
    label?: string;
    buttonText: string;
    onClicked: () => void;
    color?: 'red' | 'green' | 'blue' | 'yellow'; // Add color options
}

const LabeledButton: React.FC<LabeledButtonProps> = ({ label, buttonText, onClicked, color = 'blue' }) => {
    // Map colors to Tailwind classes
    const colorClasses: Record<string, string> = {
        red: 'bg-red-500 hover:bg-red-600 focus:ring-red-300',
        green: 'bg-green-500 hover:bg-green-600 focus:ring-green-300',
        blue: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-300',
        yellow: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-300',
    };

    return (
        <div className="flex items-center space-x-2">
            {label && (
                <label htmlFor="clickButton" className="text-gray-700 font-medium">
                    {label}
                </label>
            )}
            <button
                id="clickButton"
                onClick={onClicked}
                className={`px-4 py-2 text-white rounded shadow focus:outline-none focus:ring ${colorClasses[color]}`}
            >
                {buttonText}
            </button>
        </div>
    );
};

export default LabeledButton;
