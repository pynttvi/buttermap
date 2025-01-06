import React, { FC } from 'react';

interface CheckboxProps {
    title: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

const Checkbox: FC<CheckboxProps> = ({ title, checked, onChange }) => {
    return (
        <label className="flex items-center space-x-3 cursor-pointer">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">{title}</span>
        </label>
    );
};

export default Checkbox;
