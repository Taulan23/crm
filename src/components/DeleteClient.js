import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { deleteClient } from '../api';

export default function DeleteClient() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const confirmDelete = async () => {
      if (window.confirm('Вы уверены, что хотите удалить этого клиента?')) {
        try {
          await deleteClient(id);
          alert('Клиент успешно удален');
          navigate('/dashboard');
        } catch (error) {
          console.error('Error deleting client:', error);
          alert('Не удалось удалить клиента. Пожалуйста, попробуйте еще раз.');
          navigate('/dashboard');
        }
      } else {
        navigate('/dashboard');
      }
    };

    confirmDelete();
  }, [id, navigate]);

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Удаление клиента</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Удаление клиента...</p>
        <Button onClick={() => navigate('/dashboard')}>Вернуться на главную</Button>
      </CardContent>
    </Card>
  );
}
