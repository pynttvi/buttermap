import React from "react";
import {capitalizeFirstChar} from "@/app/utils";

interface RadioButtonGroupProps {
    label: string
    selectedOption: string,
    setSelectedOption: (setSelectedOption: string) => void
    options: Array<{name: string, value: string}>
}
const RadioButtonGroup: React.FC<RadioButtonGroupProps> = ({label, selectedOption, setSelectedOption, options}) => {

    return (
        <div className="p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-4 text-gray-800">{label}</h3>
            <div className="flex flex-col space-y-2">
                {options.map((option) => (
                    <label className="flex items-center space-x-3" key={`label-${option.value}`}>

                        <input
                            type="radio"
                            name={capitalizeFirstChar(option.name.toLowerCase())}
                            value={option.value}
                            checked={selectedOption === option.value}
                            onChange={(e) => setSelectedOption(e.target.value)}
                            className="form-radio h-5 w-5 text-blue-600 focus:ring-blue-300"
                        />
                        <span className="text-gray-700 font-medium">{capitalizeFirstChar(option.name)}</span>
                    </label>

                ))}

            </div>
        </div>
    );
};

export default RadioButtonGroup;
