const config = require('./config');
const app = require('./app');

app.listen(config.port, () => console.log(`Teen Wallet API listening on port ${config.port}`));
