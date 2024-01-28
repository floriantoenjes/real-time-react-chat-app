export function useHandleInputChange<FormState>(
    setFormData: React.Dispatch<React.SetStateAction<FormState>>,
) {
    const handleInputChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = event.target;
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: value,
        }));
    };

    return handleInputChange;
}
