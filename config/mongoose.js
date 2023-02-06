const mongoose=require('mongoose');
mongoose.connect('mongodb://localhost/issue_tracker_db');
const db=mongoose.connection;
db.on('error',console.error.bind(console,'Error connecting db'));
db.once('open',()=>console.log(`Connected to db ${db.name}`));
module.exports=db;
