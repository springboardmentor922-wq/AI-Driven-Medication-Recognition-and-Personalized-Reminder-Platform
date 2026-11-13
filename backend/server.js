require('dotenv').config();
if (process.env.APP_TIMEZONE) process.env.TZ = process.env.APP_TIMEZONE;
const express=require('express'), mongoose=require('mongoose'), cors=require('cors');
const app=express();
const { startMissedDoseMonitor } = require('./services/missedDoseMonitor');
app.use(cors({origin:process.env.CLIENT_URL||'http://localhost:5173'}));
app.use(express.json({limit:'2mb'}));
app.get('/api/health',(_req,res)=>res.json({status:'ok',service:'PillSync API'}));
for(const route of ['auth','profile','caregivers','admin','medicines','doses','analytics','ocr','notifications']) app.use('/api/'+route,require('./routes/'+route));
app.use((err,_req,res,_next)=>{console.error(err);res.status(err.status||500).json({message:err.message||'Server error'});});
const port=process.env.PORT||5000;
mongoose.connect(process.env.MONGO_URI||'mongodb://127.0.0.1:27017/pillsync')
.then(()=>app.listen(port,()=>{ console.log('PillSync API on '+port); startMissedDoseMonitor(); }))
.catch(e=>{console.error(e.message);process.exit(1);});
