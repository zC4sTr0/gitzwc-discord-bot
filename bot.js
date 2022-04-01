var Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');
var request = require('request');

var sorteio = [];
var sorteio_andamento = false;
var esperando_pm = [];
var premio = "";
var tipoPremio = 0;
var quantidadePremio = 0;

function existeArray(array, valor) {
    if(array.indexOf(valor) == -1)
        return false;

    return true;
}

const client = new Discord.Client(); 
client.login(auth.token);

logger.remove(logger.transports.Console);
logger.add(new logger.transports.File({ filename: 'error.log', level: 'debug' }));



client.on('ready', function() {
    logger.info('Connected');
    logger.info('Logged in as: ' + client.user.username + '(' + client.user.id + ')');


});

client.on("message", (message) => { 

    if (message.channel.type == 'dm') {
        client.channels.cache.get('872585774200143872').send('[<@' + message.author.id + '>]: ' + message.content);
        if(esperando_pm.length > 0) {
            for(var array = 0; array < esperando_pm.length; array++)
            {
                if(esperando_pm[array].idJogador == message.author.id) {
                    if(message.content.length < 17 && message.content.includes(" ") == false) {
                        request('http://127.0.0.1/sorteiodiscord.php?id='+message.content+'&tipo='+tipoPremio+'&quantidadePremio='+quantidadePremio, function (error, response, body) {
                            if(body != 'ok') {
                                message.author.send(body);
                            } else {
                                message.author.send('Perfeito ' + message.author.username + '! Recebi o login e já enviei o seu premio (' + premio + ')! Confira na sua conta e qualquer coisa entre em contato conosco :)');
                                esperando_pm.splice(array-1, 1);
                            }
                        });
                    } else {
                        message.author.send('Nao encontrei o login informado. Envie apenas o login sem nada adicional! Por favor tente novamente.');
                    }
                }
            }
        }
    }


    if (message.content.substring(0, 1) == '!' && message.channel.type != 'dm') {

        var autorizado_comando_restrito = false;
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];       
        args = args.splice(1);

        switch(cmd.toLowerCase()) {
            case 'oi':
                message.channel.send('oi ' + message.author.username + ' :)');
            break;

            case 'inicia_sorteio':
                message.delete();
                if(!(message.member.roles.cache.has("579345972711260161") || message.member.roles.cache.has("578590063420506133") || args < 3)) {
                    message.channel.send('Você não tem autorização para rodar este comando.');
                    return;
                }

                message.content.split(" ").slice(2).join(" ");
                premio = message.content.split(" ").slice(3).join(" ");
                tipoPremio = args[0];
                quantidadePremio = args[1];
                sorteio = [];
                message.channel.send('Um sorteio acabou de iniciar valendo ' + premio + '! Digite !sorteio (em algum destes canais: <#578578836367736843> <#578579581754146846> <#578579564461031462>) para participar :) @everyone');
                sorteio_andamento = true;
            break;

            case 'sorteio':
                message.delete();
                if(!sorteio_andamento) {
                    message.channel.send('Não existe nenhum sorteio em andamento...');
                    return;
                }

                for(var array = 0; array < sorteio.length; array++)
                {
                    if(sorteio[array].id == message.author.id) {
                        //message.author.send('Poxa ' + message.author.username + ', você já está registrado neste sorteio e não pode se registrar de novo...');
                        return;
                    }
                }
                sorteio.push({id: message.author.id, username: message.author.username});
                //logger.info(sorteio);
                message.author.send('Oi ' + message.author.username + '. Você se registrou com sucesso no nosso sorteio e esta concorrendo a ' + premio + '!');
                client.channels.cache.get('578581705376661515').send('O jogador <@' + message.author.id + '> se registrou com sucesso no sorteio valendo ' + premio + '!');
            break;

            case 'sorteo':
                message.delete();
                if(!sorteio_andamento) {
                    message.channel.send('No hay sorteo en curso....');
                    return;
                }

                for(var array = 0; array < sorteio.length; array++)
                {
                    if(sorteio[array].id == message.author.id) {
                        //message.author.send('Poxa ' + message.author.username + ', você já está registrado neste sorteio e não pode se registrar de novo...');
                        return;
                    }
                }
                sorteio.push({id: message.author.id, username: message.author.username});
                //logger.info(sorteio);
                message.author.send('Hola ' + message.author.username + '. Se ha registrado con éxito en nuestro sorteo y se postula para ' + premio + '!');
                client.channels.cache.get('578581705376661515').send('El jugador <@' + message.author.id + '> registrado con éxito para el sorteo ' + premio + '!');
            break;

            case 'premia':
                message.delete();
                if(!(message.member.roles.cache.has("579345972711260161") || message.member.roles.cache.has("578590063420506133"))) {
                    //message.channel.send('Você não tem autorização para rodar este comando.');
                    return;
                }

                if (sorteio.length == 0) {
                    return;
                }

                var item = sorteio[Math.floor(Math.random()*sorteio.length)];
                message.channel.send('*Sorteio finalizado!* O ganhador do prêmio ' + premio + ' foi o sortudo(a): <@' + item.id + '>! Verifique a sua caixa de mensagem privada que te enviei instruções de como prosseguir :)');
                client.users.cache.get(item.id).send('Parabéns ' + item.username + '! Você acabou de ganhar no sorteio ' + premio + '. Para que o seu prêmio seja entregue, por favor responda esta mensagem com o seu *login! Lembrando que **login* é o utilizado para acessar o jogo.  _*LOGIN É DIFERENTE DO NICKNAME!*_');
                esperando_pm.push({'idJogador': item.id, 'premio': premio, 'tipoPremio': tipoPremio, 'quantidadePremio': quantidadePremio});
                sorteio_andamento = false;
            break;
            
        }

       

    }
});
