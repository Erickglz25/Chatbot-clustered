var SCWorker = require('socketcluster/scworker');
var express = require('express');
var healthChecker = require('sc-framework-health-check');
const bodyParser = require('body-parser');
const apiai = require('apiai');
const mongoose = require('mongoose');
const Agent = require('./models/agent');
const Promise = require('promise');

require('dotenv').config();
const config = require('./config/config');

let AgentNameLocal = process.env.A_NAME; //variables, con valores arbitrarios complejos para evitar 'undefined'  
let AgentTokenLocal = process.env.A_TOKEN_LOCAL;//no representan ninguna vulnerabilidad
let AgentSessionLocal = process.env.A_SESSION_LOCAL;

mongoose.set('useCreateIndex', true)    
mongoose.connect(process.env.MONGODB_URI,{ useNewUrlParser: true }); 

const db = mongoose.connection; 

db.on('error', console.log.bind(console, 'connection error:'));

db.once('open', function() {                
  console.log('Connection Success');        
})


class Worker extends SCWorker {             
  run() {
    console.log('   >> Worker PID:', process.pid); 
    var environment = this.options.environment; //linea verificada set now = 'produccion'

    var app = express();       

    var httpServer = this.httpServer;   
    var scServer = this.scServer;       

    // Add GET /health-check express route
    healthChecker.attach(this, app);           

    httpServer.on('request', app);             
    
    /*
      In here we handle our incoming realtime connections and listen for events.
    */

   app.use(bodyParser.json());            
   
   app.use(bodyParser.urlencoded({ extended: true }));         

   app.post('/send-messages',config._checkToken,config._reviewBasics,function(req,res,next) {

      if( AgentNameLocal === req.body.UserName ){
          
          function getDialogFlow(){  
              return new Promise((res,rej) =>{
  
                  var request = apiai(AgentTokenLocal).textRequest(req.body.UserMsg, {
                      sessionId: req.body.UserName+'session'
                  });
                  res(request);
                  
              })
          }
      
          getDialogFlow()

              .then((request)=>{
          
                  request.on('response', function(response) { 
                      
                      if (response.result.metadata.isFallbackIntent === 'true'  || response.result.metadata.intentName === 'support.problem')
                          return res.status(201).json("Bot Asking For Help"); 
          
                      return res.status(200).json(response.result.fulfillment['speech']);
                  });
              
                  request.on('error', function(error) {
                      return res.status(501).json(error);
                  });
              
                  request.end();
              })
              .catch((err) => {
                  return res.status(403).json(err);
              });

      }else{
                  
          function SaveAgent(){  
              return new Promise((res,rej) =>{

                  Agent.findOne({agentName: req.body.UserName},function(error,myagent){
                      
                      if(error) rej(error);
                      if(myagent == null) rej('agent not found');
          
                      res(myagent);     
                  }); 
              })
          }
          
          SaveAgent()
              .then((myagent) => {
                  
                if(myagent.agentStatus == false) 
                    return res.status(403).json("El agente no tiene permisos para enviar mensajes");

                  AgentNameLocal = myagent.agentName;
                  AgentSessionLocal = myagent.agentSession;
                  AgentTokenLocal = myagent.agentToken;

                  let dialogflow = apiai(myagent.agentToken);
                  return dialogflow;

              })
              .then((dialogflow)=>{
                  var request = dialogflow.textRequest(req.body.UserMsg, {
                      sessionId: req.body.UserName+'session' || 'M4ND78ND'
                  });
                  return request;
              })
              .then((request)=>{
          
                  request.on('response', function(response) {     
                          
                      if (response.result.metadata.isFallbackIntent === 'true'  || response.result.metadata.intentName === 'support.problem')
                          return res.status(201).json("Bot Asking For Help"); 

                      return res.status(200).json(response.result.fulfillment['speech']);
                  });
              
                  request.on('error', function(error) {
                      return res.status(500).json(error);
                  });
              
                  request.end();
          
              })
              .catch((err) => {
                  return res.status(403).json(err);
              });
      }

  });                                

  app.post('/create-agent',config._checkToken,function(req,res) { 
      
      var agent = new Agent({
          agentName: req.body.Name, // validacion de campo unico
          agentToken: req.body.ClientToken,
          agentStatus: true,
          agentSession: req.body.Name+'Session'
      });

      return new Promise((res,rej) =>{
          agent.save(function(err,result){
              if(err) rej(err);
              res();     
          }); 
      }).then(()=>{
          return res.status(200).json('Agent succesfully created');
      })
      .catch((err) => {
        return res.status(403).json(err);
      });

  });

  app.use(function(err, req, res, next) {
    
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    next();
  });

  }
}

new Worker();
