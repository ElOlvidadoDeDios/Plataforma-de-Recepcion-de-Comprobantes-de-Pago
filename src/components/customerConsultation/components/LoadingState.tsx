interface LoadingStateProps {
  message?: string;
}

const LoadingState = ({ message = "Buscando cliente..." }: LoadingStateProps) => {
  return (
    <div className="text-center py-8 md:py-10 bg-white rounded-lg shadow-lg">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  );
};

export default LoadingState;