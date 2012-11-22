var http = require('http')
  , httpStatic = require('node-static')
  , file = new httpStatic.Server('.')
  , port = process.env.PORT || 4567
  , STACKMOB_API_SERVER = 'api.stackmob.com';


http.createServer(function(request, response) {

  if(request.headers['x-stackmob-proxy-plain']) {
    var host = request.headers['host'];

    if(host.toString().indexOf(':') != -1) {
      host = host.split(':');
    } else {
      host = [host, 80];
    }

    var headers = request.headers;

    headers['host'] = STACKMOB_API_SERVER,
    headers['x-forwarded-for'] = host[0],
    headers['x-stackmob-forwarded-port'] = host[1],
    headers['x-stackmob-forwared-host'] = host[0],
    headers['x-forwarded-proto'] = 'HTTP',
    headers['version'] = 'HTTP/1.1'

    var options = {
      host: STACKMOB_API_SERVER,
      port: 80,
      method: request.method,
      path: request.url,
      headers: headers
    };

    var proxyRequest = http.request(options, function(proxyResponse) {

      proxyResponse.on('data', function(chunk) {
        response.write(chunk, 'binary');
      });

      proxyResponse.on('end', function() {
        response.end();
      });

      response.writeHead(proxyResponse.statusCode, proxyResponse.headers);
    });

    request.on('data', function(chunk) {
      proxyRequest.write(chunk, 'binary');
    });

    request.on('end', function() {
      proxyRequest.end();
    });

    proxyRequest.on('error', function(error) {
      console.log(error);
    });

  } else {
    file.serve(request, response);
  }

}).listen(port);

console.log("StackMob listening at " + port);