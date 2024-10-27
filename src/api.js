import axios from 'axios';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Базовая функция для авторизованных запросов
const authFetch = async (url, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    console.log('Sending request to:', `${API_BASE_URL}${url}`);
    console.log('Request options:', { ...options, headers });

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
      credentials: 'include'
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Response data:', data);
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Авторизация
export const login = async ({ username, password }) => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Login failed');
  }
  
  const data = await response.json();
  localStorage.setItem('token', data.access_token);
  return data;
};

// Регистрация
export const register = async (username, password, role) => {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }
  return response.json();
};

// Клиенты
export const fetchClients = () => authFetch('/clients');

export const addClient = (clientData) => 
  authFetch('/clients', {
    method: 'POST',
    body: JSON.stringify(clientData),
  });

export const updateClient = async (clientId, clientData) => {
  try {
    console.log('Updating client:', clientId, clientData);
    const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to update client: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Update response:', data);
    return data;
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

export const deleteClient = (clientId) => 
  authFetch(`/clients/${clientId}`, {
    method: 'DELETE',
  });

export const fetchClient = async (id) => {
  try {
    console.log('Fetching client with ID:', id);
    console.log('API URL:', `${API_BASE_URL}/clients/${id}`);
    console.log('Token:', localStorage.getItem('token'));

    const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to fetch client: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Received client data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching client:', error);
    throw error;
  }
};

// Рассылки
export const sendCampaign = async (campaignData) => {
  try {
    const response = await authFetch('/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaignData),
    });
    return response;
  } catch (error) {
    console.error('Campaign Error:', error);
    throw error;
  }
};

// WhatsApp
export const sendWhatsAppMessage = async (to, message) => {
  try {
    const response = await axios.post(`${process.env.REACT_APP_WHATSAPP_API_URL}/messages/text`, {
      to,
      body: message,
      typing_time: 0
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });
    return response.data;
  } catch (error) {
    console.error('WhatsApp Error:', error);
    throw new Error(error.response?.data?.message || 'WhatsApp sending failed');
  }
};

// Статистика и информация
export const fetchStatistics = () => authFetch('/statistics');
export const fetchUserInfo = () => authFetch('/protected');
export const fetchProtected = () => authFetch('/protected');

export const checkAuth = async () => {
  const response = await fetch(`${API_BASE_URL}/check_auth`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Auth check failed');
  return response.json();
};

const WHATSAPP_CHANNEL_ID = process.env.REACT_APP_WHATSAPP_CHANNEL_ID;

export async function sendMessage(phoneNumber, message) {
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_WHATSAPP_API_URL}/${WHATSAPP_CHANNEL_ID}/messages`,
      {
        to: phoneNumber,
        type: 'text',
        text: {
          body: message
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export async function getMessageHistory(phoneNumber) {
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_WHATSAPP_API_URL}/${WHATSAPP_CHANNEL_ID}/messages`,
      {
        params: {
          to: phoneNumber
        },
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_WHATSAPP_TOKEN}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting message history:', error);
    throw error;
  }
}
