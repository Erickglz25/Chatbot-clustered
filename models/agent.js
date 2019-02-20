var mongoose = require('mongoose');
var Schema = mongoose.Schema;

  var agentSchema = new Schema({
    agentName: {type: String,required:true},
    agentToken: {type: String, required: true},
    agentStatus: {type: Boolean,required:true,default:true},
    agentSession: {type: String,required:true}
  });
  
module.exports = mongoose.model('Agent', agentSchema);