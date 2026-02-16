const SessionManager = require('./src/services/SessionManager');

// The token we got from the login
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTkzNDgwMjYyZTExMDFiODA1NzA4NmQiLCJzZXNzaW9uSWQiOiJmMjBmNzZkMy1mMjk4LTQ2NWUtODhhNi00YjJlODAxYmVkNDAiLCJyb2xlIjoiZmFybWVyIiwic2l0ZUlkcyI6W10sInR5cGUiOiJVU0VSIiwiaWF0IjoxNzcxMjU5OTE3LCJleHAiOjE3NzEzNDYzMTd9.0MUA8k4E055RVNmLwtxBousm2ie_Nr3jRoxnyjFRang";

require('dotenv').config();

const jwt = require('jsonwebtoken');

// Try to decode and verify
const decoded = jwt.decode(token);
console.log('Token payload:', JSON.stringify(decoded, null, 2));

// Try to verify with secret
try {
  const secret = process.env.JWT_SECRET;
  console.log('JWT_SECRET exists:', !!secret);
  
  const verified = jwt.verify(token, secret);
  console.log('✓ Token verified successfully');
  console.log('Verified payload:', JSON.stringify(verified, null, 2));
} catch(e) {
  console.log('✗ Token verification failed:', e.message);
}
