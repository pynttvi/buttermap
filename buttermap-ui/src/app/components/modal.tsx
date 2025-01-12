import React, {FC} from 'react';

interface ModalProps {
    isOpen: boolean;
    onAccept?: () => void;
    onCancel: () => void;
    title?: string;
    acceptButtonText?: string;
    children: React.ReactNode;
    fullWidth?: boolean;
    extraButtons?: React.ReactNode;
}
export interface ModalButtonProps {
    buttonText: string;
    onClicked: () => void;
    color?: 'red' | 'green' | 'blue' | 'yellow'; // Add color options
}
export const ModalButton: FC<ModalButtonProps> = ({
    buttonText,
    onClicked,
    color = "blue"
}) => {
    return (
        <button
            onClick={onClicked}
            className={`ml-2 px-4 py-2 text-sm font-semibold text-white bg-${color}-500 rounded-md hover:bg-${color}-600 focus:outline-none focus:ring focus:ring-${color}-300`}
        >
            {buttonText}
        </button>
    )
}

const Modal: FC<ModalProps> = ({
                                   isOpen,
                                   onAccept,
                                   onCancel,
                                   title,
                                   acceptButtonText,
                                   children,
                                   extraButtons,
                                   fullWidth = false
                               }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div
                className={`bg-black rounded-lg shadow-lg ${
                    fullWidth ? 'w-full max-w-none' : 'w-full max-w-lg'
                } h-screen mx-4 flex flex-col`}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-white">
                        {title || 'Modal Title'}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                        aria-label="Close Modal"
                    >
                        &times;
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 p-4 overflow-y-auto text-white">{children}</div>

                {/* Footer */}
                <div className="flex justify-end p-4 border-t border-gray-200">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring focus:ring-blue-300"
                    >
                        Close
                    </button>
                    {extraButtons}
                    {onAccept && (
                        <button
                            onClick={onAccept}
                            className="ml-2 px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring focus:ring-blue-300"
                        >
                            {acceptButtonText ?? 'Accept' }
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Modal;
