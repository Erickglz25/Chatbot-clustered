exports._checkToken = function(req,res,next){

	if (req.body.AccessToken === process.env.TOKEN_ACCESS) {    
		return next();
	}
	return res.status(403).json('Invalid Token Access');
}

exports._reviewBasics = function(req,res,next){

	let message = 'Hola';
	if(req.body.UserMsg) message = req.body.UserMsg;

    if (message.toLocaleLowerCase() === 'hola' )
		return res.status(200).json('Hola, ¿Como puedo ayudarte?');

	return next();
}