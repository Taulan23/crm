import React from 'react';
import { API_BASE_URL } from '../api';
import clientsData from '../data/clientsData';

function ClientList() {
  console.log('Clients data:', clientsData);
  console.log('API_BASE_URL:', API_BASE_URL); // Add this line for debugging

  return (
    <div>
      <h2>Список клиентов</h2>
      {clientsData.length === 0 ? (
        <p>Нет доступных данных о клиентах.</p>
      ) : (
        <ul>
          {clientsData.map(client => (
            <li key={client.id}>
              {client.firstName} {client.lastName} - {client.company}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ClientList;
