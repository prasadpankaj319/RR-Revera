require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected successfully!'))
    .catch(err => console.error('MongoDB error:', err));

// Define Mongoose Schemas
const productSchema = new mongoose.Schema({
    id: Number,
    name: String,
    price: String,
    description: String,
    sizes: [String],
    image: String,
    featured: Boolean
});
const Product = mongoose.model('Product', productSchema);

const messageSchema = new mongoose.Schema({
    id: Number,
    name: String,
    email: String,
    message: String,
    date: Date
});
const Message = mongoose.model('Message', messageSchema);

// Configure Cloudinary & Multer for file uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rrrevera_products',
    allowedFormats: ['jpg', 'png', 'jpeg', 'webp']
  }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- PRODUCTS API ---
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findOne({ id: parseInt(req.params.id) });
        if (product) res.json(product);
        else res.status(404).json({ error: 'Product not found' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin Login Route
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === (process.env.ADMIN_PASSWORD || 'admin123')) {
        res.json({ token: 'admin-token-123' });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

// Security Middleware
const requireAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader === 'Bearer admin-token-123') {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

app.post('/api/products', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const newProductData = req.body;
        newProductData.featured = (newProductData.featured === 'true');
        
        if (req.file) {
            newProductData.image = req.file.path; // This is the Cloudinary URL!
        }

        const maxProduct = await Product.findOne().sort('-id');
        newProductData.id = maxProduct && maxProduct.id ? maxProduct.id + 1 : 1;
        
        if (typeof newProductData.sizes === 'string') {
            newProductData.sizes = newProductData.sizes.split(',').map(s => s.trim()).filter(Boolean);
        }
        
        const newDoc = await Product.create(newProductData);
        res.json(newDoc);
    } catch (err) {
        res.status(500).json({ error: 'Error saving product' });
    }
});

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
    try {
        const result = await Product.findOneAndDelete({ id: parseInt(req.params.id) });
        if (result) res.json({ success: true });
        else res.status(404).json({ error: 'Product not found' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// --- MESSAGES API ---
app.post('/api/messages', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) return res.status(400).json({ error: 'All fields are required' });
        
        const newMessage = await Message.create({
            id: Date.now(),
            name,
            email,
            message,
            date: new Date()
        });
        res.json({ success: true, id: newMessage.id });
    } catch (err) {
        res.status(500).json({ error: 'Error saving message' });
    }
});

app.get('/api/messages', requireAdmin, async (req, res) => {
    try {
        const messages = await Message.find().sort('-date');
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.delete('/api/messages/:id', requireAdmin, async (req, res) => {
    try {
        const result = await Message.findOneAndDelete({ id: parseInt(req.params.id) });
        if (result) res.json({ success: true });
        else res.status(404).json({ error: 'Message not found' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Export the Express App so Vercel Serverless Functions can use it
module.exports = app;

// Local Development boot
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server (Local) is running on http://localhost:${PORT}`));
}
