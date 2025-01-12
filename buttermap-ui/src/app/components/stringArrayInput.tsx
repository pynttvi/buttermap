import React, {useCallback} from "react";

interface StringArrayInputProps {
    value: string[]; // The array of strings
    onChange: (newValue: string[]) => void; // Callback to update the array
    placeholder?: string; // Optional placeholder for input fields
    label?: string; // Optional label for the component
}

const StringArrayInput: React.FC<StringArrayInputProps> = ({
                                                               value,
                                                               onChange,
                                                               placeholder = "Enter value",
                                                               label,
                                                           }) => {
    const handleInputChange = useCallback(
        (index: number, newValue: string) => {
            const updatedArray = value.map((item, idx) =>
                idx === index ? newValue : item
            );
            onChange(updatedArray);
        },
        [value, onChange]
    );

    const handleAddItem = useCallback(() => {
        onChange([...value, ""]);
    }, [value, onChange]);

    const handleRemoveItem = useCallback(
        (index: number) => {
            const updatedArray = value.filter((_, idx) => idx !== index);
            onChange(updatedArray);
        },
        [value, onChange]
    );

    return (
        <div className="space-y-4">
            {label && <label className="block text-white font-semibold">{label}</label>}
            <div className="space-y-2">
                {value.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={item}
                            onChange={(e) => handleInputChange(index, e.target.value)}
                            placeholder={placeholder}
                            className="flex-1 p-2 bg-gray-800 text-white border border-gray-700 rounded"
                        />
                        <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-500 hover:underline"
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>
            <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
            >
                Add Item
            </button>
        </div>
    );
};

export default StringArrayInput;
