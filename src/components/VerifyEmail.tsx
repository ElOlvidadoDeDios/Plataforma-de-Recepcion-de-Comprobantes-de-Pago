import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
const API_BASE_URL = import.meta.env.VITE_LOGIN_API_BASE_URL;
const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const verificationCode = location.pathname.split('/').pop();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: verificationCode }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success(data.message);
          navigate('/login');
        } else {
          toast.error(data.message || 'Error al verificar el correo');
          navigate('/login');
        }
      } catch (error) {
        toast.error('Error al verificar el correo');
        navigate('/login');
      }
    };

    verifyEmail();
  }, [verificationCode, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6">Verificando correo...</h2>
      </div>
    </div>
  );
};

export default VerifyEmail;
