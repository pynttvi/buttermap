import React, {useState} from 'react';

interface TextFieldProps {
    label: string;
    name: string;
    placeholder?: string;
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string; // Allows specifying input type like text, email, password, etc.
    errorMessage?: string; // Optional custom error message
    maxLength?: number; // Maximum length of input
    regex?: RegExp; // Regex pattern for validation
    regexErrorMessage?: string; // Error message for regex validation
    light?: boolean
}

const TextField: React.FC<TextFieldProps> = ({
                                                 label,
                                                 name,
                                                 placeholder = '',
                                                 value,
                                                 onChange,
                                                 type = 'text',
                                                 errorMessage,
                                                 maxLength,
                                                 regex,
                                                 regexErrorMessage = 'Invalid input format', // Default regex error message
                                                 light
                                             }) => {
    const [regexError, setRegexError] = useState(false);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const {value} = event.target;

        // Check regex validation if provided
        if (regex) {
            setRegexError(!regex.test(value));
        }

        // Propagate the change event
        onChange(event);
    };

    return (
        <div className="mb-4">
            {/* Label */}
            <label
                htmlFor={name}
                className="block text-sm font-medium text-white-700 mb-1"
            >
                {label}
            </label>

            {/* Input Field */}
            <input
                type={type}
                id={name}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={handleInputChange}
                maxLength={maxLength}
                className={`
          block px-3 py-2 border shadow-sm focus:outline-none
          w-full p-2  border-gray-700 rounded-md
          focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${light ? "text-black " : "bg-gray-800 text-white"}
          ${regexError || errorMessage ? 'border-red-500' : 'border-white-300'}
        `}
            />

            {/* Error Message */}
            {(regexError && regexErrorMessage) || errorMessage ? (
                <p className="mt-1 text-sm text-red-500">
                    {regexError ? regexErrorMessage : errorMessage}
                </p>
            ) : null}
        </div>
    );
};

export default TextField;
