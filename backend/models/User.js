const m=require('mongoose');
const schema=new m.Schema({
 name:{type:String,required:true,trim:true},
 email:{type:String,unique:true,lowercase:true,trim:true,required:true,index:true},
 password:{type:String,required:true},
 role:{type:String,enum:['patient','caregiver','admin'],default:'patient'},
 caregiverIds:[{type:m.Schema.Types.ObjectId,ref:'User'}],
 patientIds:[{type:m.Schema.Types.ObjectId,ref:'User'}],
 caregiverInviteHash:{type:String,default:null},
 caregiverInviteExpiresAt:{type:Date,default:null},
 conditions:[{type:String,trim:true}],
 phone:{type:String,default:''},
 timezone:{type:String,default:'Asia/Kolkata'}
},{timestamps:true});
module.exports=m.models.User||m.model('User',schema);
