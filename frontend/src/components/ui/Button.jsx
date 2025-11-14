function Button({ children, onClick, type = "button", variant = "primary", className = "", disabled = false }) {
  const baseStyles = "px-4 py-2 rounded-md font-semibold transition-colors duration-200";
  let variantStyles = "";

  switch (variant) {
    case "primary":
      variantStyles = "bg-blue-600 text-white hover:bg-blue-700";
      break;
    case "secondary":
      variantStyles = "bg-gray-200 text-gray-800 hover:bg-gray-300";
      break;
    case "danger":
      variantStyles = "bg-red-600 text-white hover:bg-red-700";
      break;
    case "success":
      variantStyles = "bg-green-600 text-white hover:bg-green-700";
      break;
    case "outline":
      variantStyles = "border border-gray-300 text-gray-700 hover:bg-gray-100";
      break;
    default:
      variantStyles = "bg-blue-600 text-white hover:bg-blue-700";
  }

  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} ${disabledStyles} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;