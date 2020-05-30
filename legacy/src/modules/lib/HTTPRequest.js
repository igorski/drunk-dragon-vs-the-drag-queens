// promised library for Ajax requests
var Q = require('q');

var HTTPRequest = module.exports =
{
    get: function(url){
        var deferred = Q.defer();
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onload = function(ev){
            if(this.status < 400){
                deferred.resolve(this.responseText);
            } else {
                deferred.reject({
                    status: this.status,
                    message: this.responseText
                });
            }
        };
        xhr.send();
        return deferred.promise;
    }
};