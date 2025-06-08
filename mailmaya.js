function Init(){
	Core.RegisterEventHandler("FACE_RECOGNITION","1","FACE_RECOGNIZED","blackList");
	Core.RegisterEventHandler("IMAGE_EXPORT","*","EXPORT_FAILED","fallarCorreo");
	Core.RegisterEventHandler("IMAGE_EXPORT","1","EXPORT_DONE","EnviarCorreo");
	Core.RegisterEventHandler("IMAGE_EXPORT","2","EXPORT_DONE","correoVIP");
}

var Edad;
var Etnia;
var Genero;
var Lentes;

var g_folder = "C:\\export\\"; 
var l_file_name ="fotoAlarma";
var l_file_name_vip="fotoVIP";


function blackList(e){
	Log.Debug("Persona reconocida");
	var estado = e.blacklisted;	
	var apellido = e.last_name;
	var tiempo = e.capture_time;
	
	if(estado==1){
		
		textToImage="Rostro reconocido en Lista Negra";
		Core.DoReact("IMAGE_EXPORT", "1", "EXPORT","import", "cam$1;time$"+tiempo,
			"export_engine", "file",
			"export", "filename$" + l_file_name + ";dir$"+g_folder,
			"export_image", "format$jpg;quality$50","process","font:12;color:255,255,0;text:5,30,"+ textToImage +";");
		
	}

    //let params = '"import","' + importdate + '","export_engine","file","export","filename$oscartest";dir$C:\\export"'   
            console.log(params)

	if(estado==0){
		textToImage="ClienteVIP";	
		
		Core.DoReact("IMAGE_EXPORT", "2", "EXPORT","import", "cam$1;time$"+tiempo,
				"export_engine", "file",
				"export", "filename$" + l_file_name_vip + ";dir$"+g_folder,
				"export_image", "format$jpg;quality$50","process","font:12;color:255,255,0;text:5,30,"+ textToImage +";");
		
	}	
}

function EnviarCorreo(e){
	Core.DoReact("MAIL_MESSAGE","1","SEND");  //Esta macro envia el correo
	Log.Debug("Correo Black enviado");		
}

function fallarCorreo(e){
Log.Debug("Falla al exportar la imagen");
}

function correoVIP(e){
	Core.DoReact("MAIL_MESSAGE","2","SEND");  //Esta macro envia el correo
	Log.Debug("Correo Vip enviado");		
}

