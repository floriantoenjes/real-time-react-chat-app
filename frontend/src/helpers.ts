export function useHandleInputChange<FormState>(
    setFormData: React.Dispatch<React.SetStateAction<FormState>>,
) {
    const handleInputChange = (event: any) => {
        const { name, value } = event.target;
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: value,
        }));
    };

    return handleInputChange;
}

export function checkEnterPressed(event: any) {
    event = event as KeyboardEvent;

    return event.key === "Enter";
}
