import os
import logging
import hashlib
import secrets
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import praw
import sqlite3
from datetime import datetime, timedelta
import threading
import time
from typing import Optional, Dict, Any
import json
from functools import wraps

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UserRedditBot:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.reddit = None
        self.running = False
        self.thread = None
        self.settings = {}
        
    def connect_reddit(self, client_id: str, client_secret: str, username: str, password: str, user_agent: str):
        """Connect to Reddit API for this user"""
        try:
            self.reddit = praw.Reddit(
                client_id=client_id,
                client_secret=client_secret,
                username=username,
                password=password,
                user_agent=user_agent
            )
            # Test connection
            self.reddit.user.me()
            self.log_activity("INFO", "Successfully connected to Reddit API")
            return True
        except Exception as e:
            self.log_activity("ERROR", f"Failed to connect to Reddit: {str(e)}")
            return False
    
    def log_activity(self, level: str, message: str, subreddit: str = ""):
        """Log bot activity for this user"""
        conn = sqlite3.connect('bot.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO logs (user_id, timestamp, level, message, subreddit)
            VALUES (?, ?, ?, ?, ?)
        ''', (self.user_id, datetime.now().isoformat(), level, message, subreddit))
        conn.commit()
        conn.close()
        
        # Emit to this user's room only
        socketio.emit('log_update', {
            'timestamp': datetime.now().isoformat(),
            'level': level,
            'message': message,
            'subreddit': subreddit
        }, room=self.user_id)
        
        logger.info(f"User {self.user_id} - {level}: {message}")
    
    def start_monitoring(self):
        """Start bot monitoring thread"""
        if self.running:
            return False
            
        if not self.reddit:
            self.log_activity("ERROR", "Reddit connection not established")
            return False
            
        self.running = True
        self.thread = threading.Thread(target=self._monitor_loop)
        self.thread.start()
        self.log_activity("INFO", "Bot monitoring started")
        return True
    
    def stop_monitoring(self):
        """Stop bot monitoring"""
        self.running = False
        if self.thread:
            self.thread.join()
        self.log_activity("INFO", "Bot monitoring stopped")
    
    def _monitor_loop(self):
        """Main monitoring loop for this user"""
        while self.running:
            try:
                # Check for scheduled posts
                self._check_scheduled_posts()
                
                # Monitor subreddit activity
                subreddits = self.get_setting('monitored_subreddits', '').split(',')
                for subreddit_name in subreddits:
                    if subreddit_name.strip() and self.running:
                        self._monitor_subreddit(subreddit_name.strip())
                
                time.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                self.log_activity("ERROR", f"Error in monitoring loop: {str(e)}")
                time.sleep(60)  # Wait longer on error
    
    def _monitor_subreddit(self, subreddit_name: str):
        """Monitor a specific subreddit for new posts"""
        try:
            subreddit = self.reddit.subreddit(subreddit_name)
            
            # Get new posts (limit to 5 to avoid rate limits)
            for submission in subreddit.new(limit=5):
                age_hours = (time.time() - submission.created_utc) / 3600
                if age_hours < 1:  # Only log posts from last hour
                    self.log_activity("INFO", 
                        f"New post: {submission.title[:50]}...", 
                        subreddit_name)
                    
        except Exception as e:
            self.log_activity("ERROR", f"Error monitoring r/{subreddit_name}: {str(e)}")
    
    def _check_scheduled_posts(self):
        """Check and post scheduled content for this user"""
        conn = sqlite3.connect('bot.db')
        cursor = conn.cursor()
        
        now = datetime.now()
        cursor.execute('''
            SELECT id, title, content, subreddit, scheduled_time 
            FROM scheduled_posts 
            WHERE user_id = ? AND status = 'pending' AND scheduled_time <= ?
        ''', (self.user_id, now.isoformat()))
        
        posts = cursor.fetchall()
        
        for post_id, title, content, subreddit_name, scheduled_time in posts:
            try:
                subreddit = self.reddit.subreddit(subreddit_name)
                submission = subreddit.submit(title, selftext=content)
                
                # Update status
                cursor.execute('''
                    UPDATE scheduled_posts SET status = 'posted' WHERE id = ?
                ''', (post_id,))
                
                self.log_activity("INFO", f"Posted scheduled content: {title}", subreddit_name)
                
            except Exception as e:
                cursor.execute('''
                    UPDATE scheduled_posts SET status = 'failed' WHERE id = ?
                ''', (post_id,))
                self.log_activity("ERROR", f"Failed to post scheduled content: {str(e)}")
        
        conn.commit()
        conn.close()
    
    def get_setting(self, key: str, default: str = "") -> str:
        """Get user setting"""
        conn = sqlite3.connect('bot.db')
        cursor = conn.cursor()
        cursor.execute('SELECT value FROM user_settings WHERE user_id = ? AND key = ?', (self.user_id, key))
        result = cursor.fetchone()
        conn.close()
        return result[0] if result else default
    
    def set_setting(self, key: str, value: str):
        """Set user setting"""
        conn = sqlite3.connect('bot.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO user_settings (user_id, key, value) VALUES (?, ?, ?)
        ''', (self.user_id, key, value))
        conn.commit()
        conn.close()

class BotManager:
    def __init__(self):
        self.user_bots = {}  # user_id -> UserRedditBot
        self.init_database()
        
    def init_database(self):
        """Initialize SQLite database with user support"""
        conn = sqlite3.connect('bot.db')
        cursor = conn.cursor()
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                password_hash TEXT,
                email TEXT,
                created_at TEXT,
                last_login TEXT
            )
        ''')
        
        # User settings table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_settings (
                user_id TEXT,
                key TEXT,
                value TEXT,
                PRIMARY KEY (user_id, key),
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # User credentials table (encrypted)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_credentials (
                user_id TEXT PRIMARY KEY,
                client_id TEXT,
                client_secret TEXT,
                reddit_username TEXT,
                user_agent TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Activity logs table (per user)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                timestamp TEXT,
                level TEXT,
                message TEXT,
                subreddit TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Scheduled posts table (per user)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS scheduled_posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                title TEXT,
                content TEXT,
                subreddit TEXT,
                scheduled_time TEXT,
                status TEXT DEFAULT 'pending',
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        conn.commit()
        conn.close()
        
    def hash_password(self, password: str) -> str:
        """Hash password with salt"""
        salt = secrets.token_hex(16)
        password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return salt + password_hash.hex()
    
    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verify password against hash"""
        salt = password_hash[:32]
        stored_hash = password_hash[32:]
        new_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return new_hash.hex() == stored_hash
    
    def register_user(self, username: str, password: str, email: str = "") -> tuple:
        """Register a new user"""
        try:
            user_id = secrets.token_urlsafe(16)
            password_hash = self.hash_password(password)
            
            conn = sqlite3.connect('bot.db')
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO users (id, username, password_hash, email, created_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (user_id, username, password_hash, email, datetime.now().isoformat()))
            conn.commit()
            conn.close()
            
            return True, user_id
            
        except sqlite3.IntegrityError:
            return False, "Username already exists"
        except Exception as e:
            return False, str(e)
    
    def authenticate_user(self, username: str, password: str) -> tuple:
        """Authenticate user login"""
        try:
            conn = sqlite3.connect('bot.db')
            cursor = conn.cursor()
            cursor.execute('SELECT id, password_hash FROM users WHERE username = ?', (username,))
            result = cursor.fetchone()
            
            if result and self.verify_password(password, result[1]):
                user_id = result[0]
                # Update last login
                cursor.execute('UPDATE users SET last_login = ? WHERE id = ?', 
                             (datetime.now().isoformat(), user_id))
                conn.commit()
                conn.close()
                return True, user_id
            else:
                conn.close()
                return False, "Invalid credentials"
                
        except Exception as e:
            return False, str(e)
    
    def get_user_bot(self, user_id: str) -> UserRedditBot:
        """Get or create bot instance for user"""
        if user_id not in self.user_bots:
            self.user_bots[user_id] = UserRedditBot(user_id)
        return self.user_bots[user_id]

# Initialize Flask app and bot manager
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
CORS(app, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*")

bot_manager = BotManager()

# Authentication decorator
def auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

# Authentication Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    success, result = bot_manager.register_user(
        data['username'], 
        data['password'], 
        data.get('email', '')
    )
    
    if success:
        return jsonify({'success': True, 'message': 'User registered successfully'})
    else:
        return jsonify({'success': False, 'error': result}), 400

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    success, result = bot_manager.authenticate_user(data['username'], data['password'])
    
    if success:
        session['user_id'] = result
        session['username'] = data['username']
        return jsonify({
            'success': True, 
            'message': 'Login successful',
            'user_id': result
        })
    else:
        return jsonify({'success': False, 'error': result}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    user_id = session.get('user_id')
    if user_id and user_id in bot_manager.user_bots:
        bot_manager.user_bots[user_id].stop_monitoring()
    
    session.clear()
    return jsonify({'success': True})

@app.route('/api/check-auth')
def check_auth():
    if 'user_id' in session:
        return jsonify({
            'authenticated': True,
            'user_id': session['user_id'],
            'username': session.get('username')
        })
    return jsonify({'authenticated': False})

# Bot API Routes (Protected)
@app.route('/api/status')
@auth_required
def get_status():
    user_bot = bot_manager.get_user_bot(session['user_id'])
    return jsonify({
        'running': user_bot.running,
        'connected': user_bot.reddit is not None,
        'uptime': datetime.now().isoformat()
    })

@app.route('/api/connect', methods=['POST'])
@auth_required
def connect_reddit():
    data = request.json
    user_id = session['user_id']
    user_bot = bot_manager.get_user_bot(user_id)
    
    success = user_bot.connect_reddit(
        data['client_id'],
        data['client_secret'], 
        data['username'],
        data['password'],
        data['user_agent']
    )
    
    if success:
        # Save credentials securely (in production, encrypt these!)
        conn = sqlite3.connect('bot.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO user_credentials 
            (user_id, client_id, client_secret, reddit_username, user_agent)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, data['client_id'], data['client_secret'], 
              data['username'], data['user_agent']))
        conn.commit()
        conn.close()
    
    return jsonify({'success': success})

@app.route('/api/start', methods=['POST'])
@auth_required
def start_bot():
    user_bot = bot_manager.get_user_bot(session['user_id'])
    success = user_bot.start_monitoring()
    return jsonify({'success': success})

@app.route('/api/stop', methods=['POST'])
@auth_required
def stop_bot():
    user_bot = bot_manager.get_user_bot(session['user_id'])
    user_bot.stop_monitoring()
    return jsonify({'success': True})

@app.route('/api/logs')
@auth_required
def get_logs():
    user_id = session['user_id']
    conn = sqlite3.connect('bot.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT timestamp, level, message, subreddit 
        FROM logs 
        WHERE user_id = ?
        ORDER BY timestamp DESC 
        LIMIT 100
    ''', (user_id,))
    logs = cursor.fetchall()
    conn.close()
    
    return jsonify([{
        'timestamp': log[0],
        'level': log[1], 
        'message': log[2],
        'subreddit': log[3]
    } for log in logs])

@app.route('/api/schedule-post', methods=['POST'])
@auth_required
def schedule_post():
    data = request.json
    user_id = session['user_id']
    
    conn = sqlite3.connect('bot.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO scheduled_posts (user_id, title, content, subreddit, scheduled_time)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, data['title'], data['content'], data['subreddit'], data['scheduled_time']))
    conn.commit()
    conn.close()
    
    user_bot = bot_manager.get_user_bot(user_id)
    user_bot.log_activity("INFO", f"Scheduled post: {data['title']}")
    return jsonify({'success': True})

@app.route('/api/settings', methods=['GET'])
@auth_required
def get_settings():
    user_bot = bot_manager.get_user_bot(session['user_id'])
    return jsonify({
        'monitored_subreddits': user_bot.get_setting('monitored_subreddits', ''),
    })

@app.route('/api/settings', methods=['POST'])
@auth_required
def update_settings():
    data = request.json
    user_bot = bot_manager.get_user_bot(session['user_id'])
    for key, value in data.items():
        user_bot.set_setting(key, value)
    return jsonify({'success': True})

# WebSocket events
@socketio.on('connect')
def handle_connect():
    if 'user_id' in session:
        join_room(session['user_id'])
        emit('connected', {'status': 'Connected to bot'})
    else:
        emit('auth_required', {'message': 'Please log in first'})

@socketio.on('disconnect')
def handle_disconnect():
    if 'user_id' in session:
        leave_room(session['user_id'])

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)