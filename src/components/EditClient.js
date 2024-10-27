import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { fetchClient, updateClient } from '../api';

export default function EditClient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadClient = async () => {
      try {
        setLoading(true);
        const data = await fetchClient(id);
        setClient(data);
      } catch (error) {
        console.error('Error loading client:', error);
        setError(`Не удалось загрузить данные клиента: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadClient();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClient(prevClient => ({ ...prevClient, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateClient(client.id, client);
      alert('Клиент успешно обновлен');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating client:', error);
      alert(`Не удалось обновить клиента: ${error.message}`);
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;
  if (!client) return <div>Клиент не найден</div>;

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Редактировать клиента</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">ФИО</Label>
              <Input
                id="name"
                name="name"
                value={client.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                name="phone"
                value={client.phone}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={client.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="birthDate">Дата рождения</Label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                value={client.birthDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="gender">Пол</Label>
              <select
                id="gender"
                name="gender"
                value={client.gender}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300"
              >
                <option value="">Выберите пол</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </div>
          </div>
          <div className="mt-6">
            <Button type="submit">Сохранить изменения</Button>
            <Button type="button" variant="outline" className="ml-2" onClick={() => navigate('/dashboard')}>
              Отмена
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
