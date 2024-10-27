import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';

function AuthChecker({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/check-auth`, {
          credentials: 'include'
        });
        if (response.ok) {
          const authData = await response.json();
          // обработка данных аутентификации
          setIsAuthenticated(true);
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Ошибка при проверке аутентификации:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : null;
}

export default AuthChecker;
