require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const productSchema = new mongoose.Schema({
    id: Number,
    name: String,
    price: String,
    description: String,
    sizes: [String],
    image: String,
    featured: Boolean
});

const messageSchema = new mongoose.Schema({
    id: Number,
    name: String,
    email: String,
    message: String,
    date: Date
});

const Product = mongoose.model('Product', productSchema);
const Message = mongoose.model('Message', messageSchema);

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        await Product.deleteMany({});
        await Message.deleteMany({});
        console.log('Cleared existing collections');

        const productsFile = path.join(__dirname, 'data', 'products.json');
        const messagesFile = path.join(__dirname, 'data', 'messages.json');

        if (fs.existsSync(productsFile)) {
            const rawProducts = fs.readFileSync(productsFile, 'utf8');
            if (rawProducts) {
                const products = JSON.parse(rawProducts);
                await Product.insertMany(products);
                console.log(`Migrated ${products.length} products.`);
            }
        }

        if (fs.existsSync(messagesFile)) {
            const rawMessages = fs.readFileSync(messagesFile, 'utf8');
            if (rawMessages && rawMessages.trim() !== '') {
                const messages = JSON.parse(rawMessages);
                await Message.insertMany(messages);
                console.log(`Migrated ${messages.length} messages.`);
            }
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
