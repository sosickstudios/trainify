if (!process.env.NODE_ENV){
  require('config').db.host = '127.0.0.1';
  require('config').db.user = 'postgres';
  require('config').db.password = null;
}

process.env.NODE_ENV = 'testing';