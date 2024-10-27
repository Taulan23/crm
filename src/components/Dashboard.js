import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, Send, Calendar } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { fetchClients, addClient, updateClient, deleteClient, sendCampaign, fetchStatistics, fetchUserInfo, sendEmail, sendWhatsAppMessage } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

const API_URL = 'http://localhost:8000/api';

export default function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();
  const [selectedClients, setSelectedClients] = useState([]);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', birthDate: '', gender: '' });
  const [activeSection, setActiveSection] = useState('clients');
  const [campaignType, setCampaignType] = useState('');
  const [campaignMessage, setCampaignMessage] = useState('');
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userName, setUserName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingClient, setEditingClient] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserInfo()
        .then(data => {
          setIsLoggedIn(true);
          setUserRole(data.logged_in_as.role);
          setUserName(data.logged_in_as.name);
        })
        .catch((error) => {
          console.error('Error fetching user info:', error);
          setIsLoggedIn(false);
          localStorage.removeItem('token');
          navigate('/login');
        });
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/login');
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [clientsData, statisticsData] = await Promise.all([
          fetchClients(),
          fetchStatistics()
        ]);
        setClients(clientsData);
        setStatistics(statisticsData);
      } catch (err) {
        setError('Ошибка при загрузке данных: ' + err.message);
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const addClientMutation = useMutation(addClient, {
    onSuccess: () => {
      queryClient.invalidateQueries('clients');
      setNewClient({ name: '', phone: '', email: '', birthDate: '', gender: '' });
    },
  });

  const updateClientMutation = useMutation(updateClient, {
    onSuccess: () => {
      queryClient.invalidateQueries('clients');
    },
  });

  const deleteClientMutation = useMutation(deleteClient, {
    onSuccess: () => {
      queryClient.invalidateQueries('clients');
    },
  });

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.phone || !newClient.email || !newClient.birthDate || !newClient.gender) {
      alert("Пожалуйста, заполните все поля");
      return;
    }
    try {
      const addedClient = await addClient({
        ...newClient,
        lastMailingDate: null,
        mailingPreference: 'email'
      });
      setClients(prevClients => [...prevClients, addedClient]);
      setNewClient({ name: '', phone: '', email: '', birthDate: '', gender: '' });
      alert('Клиент успешно добавлен');
    } catch (error) {
      console.error('Error adding client:', error);
      alert(`Не удалось добавить клиента. Ошибка: ${error.message}`);
    }
  };

  const handleUpdateClient = async (updatedClient) => {
    try {
      console.log('Updating client:', updatedClient);
      const result = await updateClientMutation.mutateAsync({id: updatedClient.id, ...updatedClient});
      console.log('Update result:', result);
      setClients(prevClients => prevClients.map(client => client.id === updatedClient.id ? result : client));
      setEditingClient(null);
      alert('Клиент успешно обновлен');
    } catch (error) {
      console.error('Error updating client:', error);
      alert(`Не удалось обновить клиента. Ошибка: ${error.message}`);
    }
  };

  const openEditModal = (client) => {
    setEditingClient({ ...client });
    setIsEditModalOpen(true);
  };

  const handleDeleteClient = async (clientId) => {
    if (window.confirm('Вы уверены, что хотите удалить этого клиента?')) {
      try {
        await deleteClientMutation.mutateAsync(clientId);
        setClients(clients.filter(client => client.id !== clientId));
        alert('Клиент успешно удален');
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Не удалось удалить клиента. Пожалуйста, попробуйте еще раз.');
      }
    }
  };

  const handleSendCampaign = async () => {
    if (!campaignType || selectedClients.length === 0 || !campaignMessage.trim() || (campaignType === 'whatsapp' && !whatsappNumber)) {
      alert("Пожалуйста, заполните все поля");
      return;
    }

    try {
      if (campaignType === 'whatsapp') {
        const formattedNumber = whatsappNumber.replace(/\D/g, '');
        if (!formattedNumber.startsWith('7') && !formattedNumber.startsWith('8')) {
          alert('Номер должен начинаться с 7 или 8');
          return;
        }
        const finalNumber = formattedNumber.startsWith('8') ? '7' + formattedNumber.slice(1) : formattedNumber;
        
        const result = await sendWhatsAppMessage(finalNumber, campaignMessage);
        alert('Сообщение успешно отправлено через WhatsApp');
      } else {
        const result = await sendCampaign({ type: campaignType, message: campaignMessage, clients: selectedClients });
        alert(`Рассылка успешно отправлена. Успешно: ${result.success_count}, Неудачно: ${result.fail_count}`);
      }
      setCampaignType('');
      setSelectedClients([]);
      setCampaignMessage('');
      setWhatsappNumber('');
    } catch (error) {
      console.error('Ошибка при отправке кампании:', error);
      alert(`Не удалось отправить рассылку. Ошибка: ${error.message}`);
    }
  };

  const handleClientSelection = (clientId) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedClients([]);
  };

  const handleSelectAll = () => {
    if (selectedCategory === 'all') {
      setSelectedClients(clients.map(client => client.id));
    } else {
      setSelectedClients(clients.filter(client => client.type === selectedCategory).map(client => client.id));
    }
  };

  const renderEditForm = () => {
    if (!editingClient) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Редактировать клиента</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleUpdateClient(editingClient);
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">ФИО</Label>
                <Input
                  id="edit-name"
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Телефон</Label>
                <Input
                  id="edit-phone"
                  value={editingClient.phone}
                  onChange={(e) => setEditingClient({...editingClient, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingClient.email}
                  onChange={(e) => setEditingClient({...editingClient, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-birthDate">Дата рождения</Label>
                <Input
                  id="edit-birthDate"
                  type="date"
                  value={editingClient.birthDate}
                  onChange={(e) => setEditingClient({...editingClient, birthDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-gender">Пол</Label>
                <select
                  id="edit-gender"
                  value={editingClient.gender}
                  onChange={(e) => setEditingClient({...editingClient, gender: e.target.value})}
                  className="w-full p-2 border border-gray-300"
                >
                  <option value="">Выберите пол</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button type="submit" className="bg-black text-white">Сохранить изменения</Button>
              <Button type="button" variant="outline" onClick={() => setEditingClient(null)} className="bg-black text-white">Отмена</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'clients':
        return (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Клиенты</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex justify-between">
                  <Input 
                    placeholder="Поиск клиентов" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                  <Button onClick={() => setActiveSection('addClient')} className="bg-black text-white">Добавить клиента</Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Выбрать</TableHead>
                      <TableHead>ФИО</TableHead>
                      <TableHead>Телефон</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Дата рождения</TableHead>
                      <TableHead>Пол</TableHead>
                      <TableHead>Последняя рассылка</TableHead>
                      <TableHead>Предпочтение рассылки</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedClients.includes(client.id)}
                            onChange={() => handleClientSelection(client.id)}
                          />
                        </TableCell>
                        <TableCell>{client.name}</TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.birthDate}</TableCell>
                        <TableCell>{client.gender}</TableCell>
                        <TableCell>{client.lastMailingDate || 'Нет данных'}</TableCell>
                        <TableCell>{client.mailingPreference || 'Не указано'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="secondary"
                              size="sm"
                              onClick={() => setEditingClient(client)}
                              className="bg-black text-white px-2 py-1 text-xs"
                            >
                              Изменить
                            </Button>
                            <Button 
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDeleteClient(client.id)}
                              className="bg-black text-white px-2 py-1 text-xs"
                            >
                              Удалить
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            {renderEditForm()}
          </>
        );
      case 'addClient':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Добавить нового клиента</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleAddClient();
              }}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">ФИО</Label>
                    <Input
                      id="name"
                      value={newClient.name}
                      onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                      id="phone"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="birthDate">Дата рождения</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={newClient.birthDate}
                      onChange={(e) => setNewClient({...newClient, birthDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Пол</Label>
                    <select
                      id="gender"
                      value={newClient.gender}
                      onChange={(e) => setNewClient({...newClient, gender: e.target.value})}
                      className="w-full p-2 border border-gray-300"
                    >
                      <option value="">Выберите пол</option>
                      <option value="male">Мужской</option>
                      <option value="female">Женский</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" className="mt-4 w-full bg-black text-white">Сохранить</Button>
              </form>
            </CardContent>
          </Card>
        );
      case 'campaigns':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Запуск рассылки</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <label htmlFor="campaignType" className="block mb-2">Тип рассылки</label>
                <select
                  id="campaignType"
                  value={campaignType}
                  onChange={(e) => {
                    setCampaignType(e.target.value);
                    if (e.target.value !== 'whatsapp') {
                      setWhatsappNumber('');
                    }
                  }}
                  className="w-full p-2 border"
                >
                  <option value="">Выберите тип рассылки</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              {campaignType === 'whatsapp' && (
                <div className="mb-4">
                  <Label htmlFor="whatsappNumber">Номер WhatsApp</Label>
                  <Input
                    id="whatsappNumber"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="Введите номер WhatsApp"
                  />
                </div>
              )}

              <div>
                <label>Категория клиентов</label>
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все клиенты</SelectItem>
                    <SelectItem value="guest">Гости</SelectItem>
                    <SelectItem value="customer">Постоянные клиенты</SelectItem>
                    <SelectItem value="potential">Потенциальные клиенты</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSelectAll} className="bg-black text-white mt-2">Выбрать всех</Button>
              </div>

              <div className="mb-4">
                <Label>Кому рассылать</Label>
                <div className="max-h-40 overflow-y-auto border p-2">
                  {clients.map(client => (
                    <div key={client.id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id={`client-${client.id}`}
                        checked={selectedClients.includes(client.id)}
                        onChange={() => handleClientSelection(client.id)}
                      />
                      <Label htmlFor={`client-${client.id}`} className="ml-2">{client.name}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <Label htmlFor="campaignMessage">Текст сообщения</Label>
                <Textarea
                  id="campaignMessage"
                  value={campaignMessage}
                  onChange={(e) => setCampaignMessage(e.target.value)}
                  placeholder="Введите текст сообщения"
                  className="w-full"
                />
              </div>

              <Button 
                onClick={handleSendCampaign} 
                disabled={!campaignType || selectedClients.length === 0 || !campaignMessage || (campaignType === 'whatsapp' && !whatsappNumber)}
                className="bg-black text-white"
              >
                Запустить рассылку
              </Button>
            </CardContent>
          </Card>
        );
      case 'statistics':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="clients">
                <TabsList>
                  <TabsTrigger value="clients">Клиенты</TabsTrigger>
                  <TabsTrigger value="messages">Сообщения</TabsTrigger>
                </TabsList>
                <TabsContent value="clients">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Распределение по полу</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie 
                              data={[
                                { name: 'Мужской', value: statistics?.genderData?.male || 0 },
                                { name: 'Женский', value: statistics?.genderData?.female || 0 }
                              ]} 
                              dataKey="value" 
                              nameKey="name" 
                              cx="50%" 
                              cy="50%" 
                              outerRadius={80} 
                              fill="#8884d8" 
                              label 
                            />
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Распределение по возрасту</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={Object.entries(statistics?.ageData || {}).map(([name, value]) => ({ name, value }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#82ca9d" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value="messages">
                  <Card>
                    <CardHeader>
                      <CardTitle>Статистика рассылок</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={statistics?.campaignData || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="successCount" name="Успешно" fill="#82ca9d" />
                          <Bar dataKey="failCount" name="Не доставлено" fill="#ff7300" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  if (loading) return <div>Загрузка данных...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h1 className="text-xl font-bold text-gray-800 mb-4">CRM Система</h1>
          <nav className="space-y-1">
            <Button 
              variant={activeSection === 'clients' ? "default" : "ghost"} 
              className="w-full justify-start text-left font-normal text-gray-700 hover:bg-gray-100"
              onClick={() => setActiveSection('clients')}
            >
              <Users className="mr-2 h-4 w-4" />
              <span>Клиенты</span>
            </Button>
            <Button 
              variant={activeSection === 'campaigns' ? "default" : "ghost"}
              className="w-full justify-start text-left font-normal text-gray-700 hover:bg-gray-100"
              onClick={() => setActiveSection('campaigns')}
            >
              <Send className="mr-2 h-4 w-4" />
              <span>Рассылки</span>
            </Button>
            <Button 
              variant={activeSection === 'statistics' ? "default" : "ghost"}
              className="w-full justify-start text-left font-normal text-gray-700 hover:bg-gray-100"
              onClick={() => setActiveSection('statistics')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              <span>Статистика</span>
            </Button>
          </nav>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8 flex justify-between items-center">
            <h2 className="text-3xl font-bold text-gray-800">Панель управления</h2>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                {userName ? `${userName}, ` : 'Имя не получено, '}
                Роль: {userRole === 'admin' ? 'Администратор' : 'Менеджер'}
              </span>
              <Button onClick={handleLogout} variant="secondary" className="bg-black text-white">Выйти</Button>
            </div>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
