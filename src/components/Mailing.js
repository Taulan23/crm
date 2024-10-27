import React, { useState } from 'react';
import clientsData from '../data/clientsData';

function Mailing() {
  const [mailingType, setMailingType] = useState('email');
  const [message, setMessage] = useState('');

  const handleSendMailing = () => {
    // Здесь будет логика отправки рассылки
    console.log(`Отправка ${mailingType} рассылки: ${message}`);
    alert('Рассылка отправлена!');
  };

  return (
    <div className="Mailing">
      <h3>Создать рассылку</h3>
      <select value={mailingType} onChange={(e) => setMailingType(e.target.value)}>
        <option value="email">Email</option>
        <option value="whatsapp">WhatsApp</option>
      </select>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Введите текст рассылки"
      />
      <button onClick={handleSendMailing}>Отправить рассылку</button>
    </div>
  );
}

export default Mailing;
