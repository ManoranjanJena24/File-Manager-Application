const express = require('express');
const userRoutes = require('./routes/users');
const folderRoutes = require('./routes/folders');
const fileRoutes = require('./routes/files');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
