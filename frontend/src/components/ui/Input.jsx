function Input({ label, id, type = "text", value, onChange, placeholder, required = false, className = "", step, min, max, ...props }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        step={step}
        min={min}
        max={max}
        className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${className}`}
        {...props}
      />
    </div>
  );
}

export default Input;