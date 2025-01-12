import React, {useState} from "react";

interface ColorPickerProps {
    colors: string[]; // Array of hex color codes
    onChange: (selectedColor: string) => void; // Callback when color is selected
    displayColor?: boolean // Callback when color is selected
}

const ColorPicker: React.FC<ColorPickerProps> = ({colors, onChange, displayColor = false}) => {
    const [selectedColor, setSelectedColor] = useState<string>(colors[0]);

    const handleColorSelect = (color: string) => {
        setSelectedColor(color);
        onChange(color); // Notify parent of color change
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="grid grid-cols-5 gap-2">
                {colors.map((color) => (
                    <button
                        key={color}
                        style={{backgroundColor: color}}
                        className={`w-10 h-10 rounded-full border-2 ${
                            selectedColor === color ? "border-black" : "border-transparent"
                        }`}
                        onClick={() => handleColorSelect(color)}
                    />
                ))}
            </div>
            {displayColor && (
                <div className="text-center">
                    <span className="text-gray-700">Selected Color:</span>{" "}
                    <span className="font-semibold">{selectedColor}</span>
                </div>
            )}

        </div>
    );
};

export default ColorPicker;
