import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function readUsers() {
  try {
    const data = readFileSync(join(__dirname, 'data', 'users.json'), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Ошибка чтения users.json:', error);
    return [];
  }
}

function writeUsers(users) {
  try {
    writeFileSync(
      join(__dirname, 'data', 'users.json'),
      JSON.stringify(users, null, 2),
      'utf-8'
    );
    return true;
  } catch (error) {
    console.error('Ошибка записи users.json:', error);
    return false;
  }
}

function readProducts() {
  try {
    const data = readFileSync(join(__dirname, 'data', 'products.json'), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Ошибка чтения products.json:', error);
    return [];
  }
}

app.get('/api/products', (req, res) => {
  const products = readProducts();
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const products = readProducts();
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Продукт не найден' });
  }
});

app.post('/api/login', (req, res) => {
  const { login, password } = req.body;
  
  if (!login || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Логин и пароль обязательны' 
    });
  }

  const users = readUsers();
  const user = users.find(u => u.login === login && u.password === password);
  
  if (user) {
    const { password, ...userWithoutPassword } = user;
    res.json({ 
      success: true, 
      user: userWithoutPassword 
    });
  } else {
    res.status(401).json({ 
      success: false, 
      error: 'Неверный логин или пароль' 
    });
  }
});

app.post('/api/register', (req, res) => {
  const { login, password, name } = req.body;
  
  if (!login || !password || !name) {
    return res.status(400).json({ 
      success: false, 
      error: 'Все поля обязательны' 
    });
  }

  const users = readUsers();
  
  if (users.find(u => u.login === login)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Пользователь с таким логином уже существует' 
    });
  }

  const newUser = {
    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
    login,
    password,
    name,
    role: 'user'
  };

  users.push(newUser);
  
  if (writeUsers(users)) {
    const { password, ...userWithoutPassword } = newUser;
    res.json({ 
      success: true, 
      user: userWithoutPassword 
    });
  } else {
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при сохранении пользователя' 
    });
  }
});

app.get('/api/users', (req, res) => {
  const users = readUsers();
  const usersWithoutPasswords = users.map(({ password, ...user }) => user);
  res.json(usersWithoutPasswords);
});

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
