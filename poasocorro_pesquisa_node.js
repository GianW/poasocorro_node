var  Mongoose  = require('mongoose');

var palavraSchema = new Mongoose.Schema(
    {
        nome: { type: String },
        valores: Object
    });

var historicoSchema = new Mongoose.Schema(
  {
    linha: String,
    data: String
  });

var http      = require('http');

function onRequest(request, response){
    console.log("Requisição recebida");
    response.writeHead(200, {"Content-Type": "text;plain"});

    if (request.url === "/") {
        response.write("Sorry Buddy :(");
    }else{          
        var parametroRecebido   = request.url.split("=");
        
        if (parametroRecebido.length > 1) {

            var listaPalavras       = parametroRecebido[1].split(",");


            pesquisaPalavra(listaPalavras,
                //Função de callback após consulta
                function(data){                  
                  //Se retornar dados da pesquisa
                  if (data != "") {
                    var obj           = JSON.parse(data);  
                    var qtdeRegistros = obj.length;
                    var listaValores  = new Array();
                    var varRetorno    = "";
                    
                    // Monta array com todos valores retornados da pesquisa
                    for (var i = 0; i < qtdeRegistros; i++) {
                        for (var j = 0; j < obj[i].colunas.length; j++) {
                          listaValores.push([obj[i].colunas[j], obj[i].valores[obj[i].colunas[j]]]);
                        };
                    };

                    var tamanhoArray  = listaValores.length;

                    for (var i = 0; i < tamanhoArray; i++) {
                    
                        if (listaValores[i][0] != "") {

                           for (var j = i + 1; j < tamanhoArray; j++) {
                              if (listaValores[i][0] == listaValores[j][0]) {
                                listaValores[i][1] = parseInt(listaValores[i][1]) + parseInt(listaValores[j][1]);
                                listaValores[j][0] = ""; 
                                listaValores[j][1] = ""; 
                              };   
                            };

                        }; 
                    };

                    for (var i = 0; i < tamanhoArray; i++) {
                        if (listaValores[i][1] > 4) {
                            
                            if (varRetorno == "") {
                              varRetorno = listaValores[i][0];
                            }else{
                              varRetorno = "prontoatendimento";
                            }
                        };
                        if (i == (tamanhoArray -1)) { 
                             if (varRetorno == "") {
                               varRetorno = "prontoatendimento";
                            };
                        };
                    }
                   
                    varRetorno = "{'retorno':'"+ varRetorno + "'}";

                    response.write("'" + varRetorno + "'");    
                  };
                 
          	   response.end();        
            });
        }else{
            response.write("INVALID PARAMETERS");
        }
    } 
          
 };

http.createServer(onRequest).listen(1337, '127.0.0.1');
console.log("Node.js foi iniciado");
Mongoose.connect('mongodb://localhost/pesquisa'); 

function pesquisaPalavra(listaPalavras, callback){
    
    var pesqPalavra   = Mongoose.model('palavras', palavraSchema);
    var db            = Mongoose.connection;
    var retorno_r     = "";
    var tamLista      = listaPalavras.length;
    var arrayPalavras = new Array();

    var gravaPalavra  = Mongoose.model('historico', historicoSchema);

    db.on('error', console.error);

    db.once('open', function() {
        console.log('Conectado ao MongoDB.');
    });
 
    for (var i = 0; i < tamLista; i++) {
        if (listaPalavras[i].length > 2 ) {
          arrayPalavras.push(listaPalavras[i]);
        };        
    };

    // Grava pesquisa
    var gravaPesquisa = new gravaPalavra({
        linha: listaPalavras.toString(),
        data: new Date()
    });

    gravaPesquisa.save(function(err, gravaPesquisa) {
      if (err) return console.error(err);
      // console.dir(gravaPesquisa);
    });
    // Fim grava pesquisa
    
     pesqPalavra.find( {nome: {$in: arrayPalavras}}, function(err, palRetorno) {   
         if (err) return console.error(err);   
         retorno_r = JSON.stringify(palRetorno);             
                  
         callback(retorno_r);
    });
}