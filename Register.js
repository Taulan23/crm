import React, { useState } from 'react';
import { register } from './api';
import './Register.css';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess(false);

    try {
      const response = await register(username, password, role);
      console.log('Registration successful:', response);
      setSuccess(true);
      setUsername('');
      setPassword('');
      setRole('user');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Произошла ошибка при регистрации. Пожалуйста, попробуйте снова.');
      console.log('Full error object:', error);
      console.log('Error name:', error.name);
      console.log('Error message:', error.message);
      if (error.stack) {
        console.log('Error stack:', error.stack);
      }
    }
  };

  return (
    <div className="register-container">
      <h2>Регистрация в CRM системе</h2>
      {success && <p className="success-message">Регистрация прошла успешно!</p>}
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleRegister}>
        <div className="form-group">
          <label htmlFor="username">Имя пользователя</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Пароль</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="role">Роль</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="user">Пользователь</option>
            <option value="admin">Администратор</option>
          </select>
        </div>
        <button type="submit" className="register-button">Зарегистрироваться</button>
      </form>
      <p>
        Уже есть аккаунт? <a href="/login">Войти</a>
      </p>
    </div>
  );
}

export default Register;
