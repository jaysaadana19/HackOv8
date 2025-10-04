import { Toaster as Sonner, toast } from "sonner"

const Toaster = ({
  ...props
}) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        style: {
          background: '#1f2937',
          border: '1px solid #374151',
          color: '#f3f4f6',
        },
        classNames: {
          toast:
            "group toast",
          description: "text-gray-300",
          actionButton:
            "bg-teal-600 text-white",
          cancelButton:
            "bg-gray-700 text-gray-300",
          success: "border-green-500/30 bg-gray-900",
          error: "border-red-500/30 bg-gray-900",
          warning: "border-yellow-500/30 bg-gray-900",
          info: "border-blue-500/30 bg-gray-900",
        },
      }}
      {...props} />
  );
}

export { Toaster, toast }
