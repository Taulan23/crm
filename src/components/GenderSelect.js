import React, { useState } from 'react';

function GenderSelect() {
  const [selectedGender, setSelectedGender] = useState('');

  const handleGenderChange = (event) => {
    console.log('Selected gender:', event.target.value);
    setSelectedGender(event.target.value);
  };

  return (
    <div>
      <h3>Выберите пол:</h3>
      <select value={selectedGender} onChange={handleGenderChange}>
        <option value="">Выберите...</option>
        <option value="male">Мужской</option>
        <option value="female">Женский</option>
        <option value="other">Другой</option>
      </select>
      <p>Выбранный пол: {selectedGender || 'Не выбран'}</p>
    </div>
  );
}

export default GenderSelect;
