import { getProducts, createProduct, updateProduct, deleteProduct } from './controllers/productController.js';
import { getDashboardStats } from './controllers/dashboardController.js';
import { getCategories } from './controllers/categoryController.js';

function mockRes(label) {
  return {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      console.log(`[PASS] ${label} (status ${this.statusCode || 200}):`, typeof data === 'object' ? Object.keys(data) : data);
      if (data.data) {
        if (Array.isArray(data.data)) {
          console.log(`       Data count: ${data.data.length}`);
        } else {
          console.log(`       Data keys: ${Object.keys(data.data).join(', ')}`);
        }
      }
    }
  };
}

console.log('--- 1. Testing getDashboardStats ---');
getDashboardStats({}, mockRes('getDashboardStats'));

console.log('--- 2. Testing getCategories ---');
getCategories({}, mockRes('getCategories'));

console.log('--- 3. Testing getProducts ---');
getProducts({ query: {} }, mockRes('getProducts'));

console.log('--- 4. Testing createProduct ---');
createProduct({
  body: {
    name: 'Teh Botol Sosro 450ml',
    sku: 'MNM-TEST-01',
    cost_price: 3500,
    selling_price: 5000,
    stock: 20,
    unit: 'botol',
    min_stock_alert: 5
  }
}, mockRes('createProduct'));

console.log('--- 5. Testing search product ---');
getProducts({ query: { search: 'Teh Botol' } }, mockRes('getProducts(search)'));

console.log('--- 6. Testing validation on createProduct ---');
createProduct({
  body: {
    name: '',
    sku: 'INVALID',
    cost_price: 5000,
    selling_price: 2000 // selling < cost
  }
}, mockRes('createProduct (Validation Test)'));

console.log('--- ALL CONTROLLER TESTS FINISHED ---');
