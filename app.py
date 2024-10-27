from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import logging
import os
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from enum import Enum  # Добавьте эту строку
from flask_mail import Mail, Message
from dotenv import load_dotenv
import hashlib

# Настройка логгера
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()  # загрузка переменных окружения из файла .env

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3001"}}, supports_credentials=True)

# Configure JWT
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Change this to a secure random key
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
jwt = JWTManager(app)

database_url = os.environ.get('DATABASE_URL', 'postgresql://username:password@db:5432/crm')
if not database_url:
    raise ValueError("No DATABASE_URL set for Flask application")

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class ClientType(Enum):
    GUEST = 'guest'
    CUSTOMER = 'customer'
    POTENTIAL = 'potential'

class Client(db.Model):
    __tablename__ = 'clients'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    birth_date = db.Column(db.Date, nullable=False)
    gender = db.Column(db.String(10), nullable=False)
    last_campaign = db.Column(db.Date)
    type = db.Column(db.String(20), nullable=True, default='potential')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'birthDate': self.birth_date.isoformat(),
            'gender': self.gender,
            'lastCampaign': self.last_campaign.isoformat() if self.last_campaign else None,
            'type': self.type
        }

class Campaign(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(20), nullable=False)
    message = db.Column(db.Text, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    success_count = db.Column(db.Integer, default=0)
    fail_count = db.Column(db.Integer, default=0)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'admin' или 'manager'

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')

mail = Mail(app)

def create_test_data():
    try:
        logger.info("Creating test data...")
        if Client.query.count() == 0:
            test_clients = [
                Client(name="Иван Иванов", phone="+79001234567", email="ivan@example.com", birth_date=datetime(1990, 5, 15), gender="male", type=ClientType.CUSTOMER.value),
                Client(name="Анна Петрова", phone="+79009876543", email="anna@example.com", birth_date=datetime(1985, 8, 20), gender="female", type=ClientType.POTENTIAL.value),
                Client(name="Сергей Сидоров", phone="+79007894561", email="sergey@example.com", birth_date=datetime(1988, 3, 10), gender="male", type=ClientType.GUEST.value),
            ]
            db.session.add_all(test_clients)
            db.session.commit()

        if Campaign.query.count() == 0:
            test_campaigns = [
                Campaign(type="whatsapp", message="Тестовая рассылка WhatsApp", date=datetime.now() - timedelta(days=5), success_count=3, fail_count=2),
                Campaign(type="email", message="Тестовая рассылка Email", date=datetime.now() - timedelta(days=2), success_count=4, fail_count=1)
            ]
            db.session.add_all(test_campaigns)
            db.session.commit()
        logger.info("Test data created successfully.")
    except Exception as e:
        logger.error(f"Error creating test data: {str(e)}")

def create_test_user():
    test_user = User.query.filter_by(username='Марина').first()
    if not test_user:
        hashed_password = generate_password_hash('12345', method='pbkdf2:sha256')
        new_user = User(username='Марина', password=hashed_password, role='manager')
        db.session.add(new_user)
        db.session.commit()
        logger.info("Тестовый пользователь 'Марина' создан")

@app.before_request
def log_request_info():
    app.logger.debug('Headers: %s', request.headers)
    app.logger.debug('Body: %s', request.get_data())

@app.after_request
def log_response_info(response):
    app.logger.debug('Response Status: %s', response.status)
    app.logger.debug('Response Headers: %s', response.headers)
    return response

@app.route('/')
def home():
    return jsonify({"message": "Welcome to the CRM API"}), 200

@app.route('/api/')
def api_root():
    return jsonify({"message": "Welcome to the CRM API"}), 200

@app.route('/api/clients', methods=['GET', 'POST'])
@jwt_required()
def clients():
    if request.method == 'GET':
        clients = Client.query.all()
        return jsonify([client.to_dict() for client in clients])
    elif request.method == 'POST':
        try:
            data = request.json
            app.logger.info(f"Received client data: {data}")
            new_client = Client(
                name=data['name'],
                phone=data['phone'],
                email=data['email'],
                birth_date=datetime.strptime(data['birthDate'], '%Y-%m-%d').date(),
                gender=data['gender'],
                type=data.get('type', 'potential')
            )
            db.session.add(new_client)
            db.session.commit()
            app.logger.info(f"New client added: {new_client.to_dict()}")
            return jsonify(new_client.to_dict()), 201
        except Exception as e:
            app.logger.error(f"Error adding client: {str(e)}")
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

@app.route('/api/clients/<int:client_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def client(client_id):
    client = Client.query.get_or_404(client_id)
    if request.method == 'PUT':
        data = request.json
        client.name = data.get('name', client.name)
        client.phone = data.get('phone', client.phone)
        client.email = data.get('email', client.email)
        client.birth_date = datetime.strptime(data.get('birthDate', client.birth_date.isoformat()), '%Y-%m-%d').date()
        client.gender = data.get('gender', client.gender)
        client.type = data.get('type', client.type)
        db.session.commit()
        return jsonify(client.to_dict())
    elif request.method == 'DELETE':
        db.session.delete(client)
        db.session.commit()
        return '', 204

@app.route('/api/campaigns', methods=['POST'])
@jwt_required()
def create_campaign():
    try:
        data = request.json
        app.logger.info(f"Received campaign data: {data}")
        
        new_campaign = Campaign(type=data['type'], message=data['message'])
        db.session.add(new_campaign)
        
        success_count = 0
        fail_count = 0
        
        for client_id in data['clients']:
            client = Client.query.get(client_id)
            if client:
                app.logger.info(f"Attempting to send campaign to client: {client.email}")
                try:
                    if data['type'] == 'email':
                        send_email_to_client(client, data['message'])
                    client.last_campaign = datetime.now()
                    success_count += 1
                    app.logger.info(f"Successfully sent campaign to {client.email}")
                except Exception as e:
                    app.logger.error(f"Failed to send campaign to {client.email}: {str(e)}", exc_info=True)
                    fail_count += 1
        
        new_campaign.success_count = success_count
        new_campaign.fail_count = fail_count
        db.session.commit()
        
        app.logger.info(f"Campaign created and sent: {new_campaign.id}, Success: {success_count}, Fail: {fail_count}")
        return jsonify({'id': new_campaign.id, 'message': 'Campaign sent successfully', 'success_count': success_count, 'fail_count': fail_count}), 201
    except Exception as e:
        app.logger.error(f"Error creating campaign: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

def send_email_to_client(client, message):
    try:
        msg = Message("New Campaign",
                      recipients=[client.email])
        msg.body = message
        mail.send(msg)
        app.logger.info(f"Email sent to {client.email}")
    except Exception as e:
        app.logger.error(f"Error sending email to {client.email}: {str(e)}", exc_info=True)
        raise

@app.route('/api/statistics', methods=['GET'])
@jwt_required()
def get_statistics():
    clients = Client.query.all()
    campaigns = Campaign.query.all()

    gender_data = {
        'male': Client.query.filter_by(gender='male').count(),
        'female': Client.query.filter_by(gender='female').count()
    }

    age_data = {
        '18-25': 0,
        '26-35': 0,
        '36-45': 0,
        '46+': 0
    }

    for client in clients:
        age = (datetime.now().date() - client.birth_date).days // 365
        if age <= 25:
            age_data['18-25'] += 1
        elif age <= 35:
            age_data['26-35'] += 1
        elif age <= 45:
            age_data['36-45'] += 1
        else:
            age_data['46+'] += 1

    campaign_data = [{
        'id': c.id,
        'type': c.type,
        'date': c.date.isoformat(),
        'successCount': c.success_count,
        'failCount': c.fail_count
    } for c in campaigns]

    return jsonify({
        'totalClients': len(clients),
        'genderData': gender_data,
        'ageData': age_data,
        'campaignData': campaign_data
    })

@app.errorhandler(404)
def not_found_error(error):
    return jsonify({"error": "Not found", "message": "Requested resource not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error", "message": "An unexpected error occurred"}), 500

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"error": "Username already exists"}), 400
    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
    new_user = User(username=data['username'], password=hashed_password, role=data['role'])
    db.session.add(new_user)
    db.session.commit()
    app.logger.info(f"New user registered: {new_user.username}, role: {new_user.role}")
    return jsonify({"message": "User created successfully"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    if user and check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity=user.username)
        return jsonify(access_token=access_token, username=user.username, role=user.role), 200
    return jsonify({"error": "Invalid username or password"}), 401

@app.route('/api/logout', methods=['POST'])
@jwt_required()
def logout():
    # В JWT нет прямого способа "выйти", но мы можем добавить токен в черный список
    # Это потребует дополнительной настройки JWTManager
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/api/check_auth', methods=['GET'])
@jwt_required()
def check_auth():
    current_user = get_jwt_identity()
    user = User.query.filter_by(username=current_user).first()
    return jsonify({"authenticated": True, "username": current_user, "role": user.role}), 200

# Пример защищенного маршрута
@app.route('/api/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    user = User.query.filter_by(username=current_user).first()
    print(f"User data: {user.username}, {user.role}")  # Добавьте эту строку для отладки
    return jsonify(logged_in_as={"username": user.username, "role": user.role, "name": user.username}), 200

@app.route('/api/check_user/<username>', methods=['GET'])
def check_user(username):
    user = User.query.filter_by(username=username).first()
    if user:
        return jsonify({"exists": True, "username": user.username, "role": user.role}), 200
    return jsonify({"exists": False}), 404

@app.route('/api/send_email', methods=['POST'])
@jwt_required()
def send_email():
    data = request.json
    recipients = data.get('recipients', [])
    subject = data.get('subject', 'No subject')
    body = data.get('body', '')

    try:
        msg = Message(subject,
                      sender=app.config['MAIL_USERNAME'],
                      recipients=recipients)
        msg.body = body
        mail.send(msg)
        return jsonify({"message": "Email sent successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def init_db():
    with app.app_context():
        try:
            # Проверка подключения к базе данных
            db.session.execute('SELECT 1')
            logger.info("Successfully connected to the database.")
            
            db.create_all()
            logger.info("All database tables created.")
            
            # Проверка существования таблицы User
            if User.__table__.exists(db.engine):
                logger.info("User table exists.")
            else:
                User.__table__.create(db.engine)
                logger.info("User table created.")
            
            create_test_data()
            create_test_user()  # Добавляем вызов функции создания тестового пользователя
            logger.info("Database initialized with tables and test data.")
        except Exception as e:
            logger.error(f"Error initializing database: {str(e)}")
            raise

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=8000, debug=True)
