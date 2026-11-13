const jwt=require('jsonwebtoken'), User=require('../models/User');
module.exports=async(req,res,next)=>{try{
 const h=req.headers.authorization||'', token=h.startsWith('Bearer ')?h.slice(7):null;
 if(!token)return res.status(401).json({message:'Login required'});
 const p=jwt.verify(token,process.env.JWT_SECRET),u=await User.findById(p.id).select('-password');
 if(!u)return res.status(401).json({message:'User not found'});req.user=u;next();
}catch(e){res.status(401).json({message:'Invalid or expired token'});}};
