# Используем официальный образ Node.js
FROM node:14

# Устанавливаем рабочую директорию в контейнере
WORKDIR /app

# Копируем package.json и package-lock.json (если есть)
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код приложения
COPY . .

# Собираем приложение для production
RUN npm run build

# Открываем порт, который будет использоваться приложением
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"]
