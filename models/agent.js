var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;

  var agentSchema = new Schema({
    agentName: {type: String,required:true,unique:true,uniqueCaseInsensitive: true},
    agentToken: {type: String, required: true,unique:true},
    agentStatus: {type: Boolean,required:true,default:true},
    agentSession: {type: String,required:true}
  });

agentSchema.plugin(uniqueValidator,{ message: 'Error, expected Name to be unique.' });
  
module.exports = mongoose.model('Agent', agentSchema);