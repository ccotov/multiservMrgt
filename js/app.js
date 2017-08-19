var app = angular.module("lubricentro", ["ui.bootstrap", "ngRoute"]);

app.constant('AIRTABLE_KEY', 'keycS5NvHoRLPCVdl');

app.config(["$routeProvider", function($routeProvider) {
    $routeProvider
    .when("/", {
        redirectTo: "/inicio-sesion"
    })
    .when("/inicio-sesion", {
        templateUrl : "templates/inicio-sesion.htm",
        controller: "InicioSesionCtrl"
    })
    .when("/inicio", {
        templateUrl : "templates/inicio.htm",
        controller: "InicioCtrl"
    })
    .when("/citas", {
        templateUrl : "templates/citas.htm",
        controller: "CitasCtrl",
        authenticated: true
    })
    .when("/cita:id", {
        templateUrl : "templates/detalle-cita.htm",
        controller: "DetalleCitaCtrl",
        authenticated: true
    })
    .when("/citas/editar/:id", {
        templateUrl : "templates/formulario-cita.htm",
        controller: "CitaCtrl",
        authenticated: true
    })
    .when("/citas/completar/:id", {
        templateUrl : "templates/completar-cita.htm",
        controller: "CitaCtrl",
        authenticated: true
    })
    .when("/citas/agregar", {
        templateUrl : "templates/formulario-cita.htm",
        controller: "CitaCtrl",
        authenticated: true
    })

    .when("/clientes", {
        templateUrl : "templates/clientes.htm",
        controller: "ClienteCtrl",
        authenticated: true
    })
    .when("/cliente/agregar", {
        templateUrl : "templates/agregar-cliente.htm",  
        controller: "AgregarClienteCtrl",
        authenticated: true
    })
    .when("/cliente/:id", {
        templateUrl : "templates/editar-cliente.htm",
        controller: "EditarClienteCtrl",
        authenticated: true
    })

    .when("/posibles-proximos-cambios", {
        templateUrl : "templates/posibles-proximos-cambios.htm",
        controller: "PosiblesProximosCambiosCtrl",
        authenticated: true
    })
}]);

app.run([ '$rootScope', 'ServiciosService', '$location', 'authFact', function($rootScope, ServiciosService, $location, authFact) {
    
    

    ServiciosService.getAll().then(function(value){
        $rootScope.LISTA_SERVICIOS = value;
    });

    $rootScope.$on('$routeChangeStart', function(event, next, current) {

        if (next.$$route.authenticated) {
            var userAuth = authFact.getAccessToken();
            if (!userAuth) {
                $location.path('/');
            }
        }

    }); 

}]);

app.factory ('authFact', [function() {
    var authFact = {};
    
    authFact.setAccessToken = function(accessToken) {
        authFact.authToken = accessToken;
    };

    authFact.getAccessToken = function() {
        return authFact.authToken;
    };

    return authFact;

}]);

app.service('AirtableService', function(AIRTABLE_KEY) {
	var Airtable = require('airtable');
	Airtable.configure({
	    endpointUrl: 'https://api.airtable.com',
	    apiKey: AIRTABLE_KEY
	});
    
    this.getBase = function() {
		return Airtable.base('appNGQ13vgGhLtMNq')
    };
});

app.service('VehiculosService', ['AirtableService', function(AirtableService) {

    this.getAll = function(cliente) {
        
        var base = AirtableService.getBase();
        
        return base('Vehiculos').select({
            view: 'Grid view',
            filterByFormula: '({Clientes} = "'+cliente+'")'
        }).all();
    };

    this.add = function(vehiculo) {

        var base = AirtableService.getBase();

        return base('Vehiculos').create({
            "Clientes": [vehiculo.clienteid],
            "Modelo": vehiculo.Modelo,
            "Marca": vehiculo.Marca,
            "Anno": vehiculo.Anno,
            "FrecuenciaCambioAceite": vehiculo.FrecuenciaCambioAceite,
            "Placa": vehiculo.Placa
        });
    }
}]);

app.service('ClientesService', ['AirtableService', function(AirtableService) {

    this.getAll = function() {
		
		var base = AirtableService.getBase();
		
		return base('Clientes').select({
			view: 'Grid view'
		}).all();
    };


    this.getById = function (id) {
        
        var base = AirtableService.getBase();
        
        return base('Clientes').find(id);
    }


    this.delete = function(cliente) {

        var base = AirtableService.getBase();
        
        return base('Clientes').destroy(cliente, function (err, deletedCliente) {
            if (err) { console.error(err); return; }
                console.log('Deleted cliente', deletedCliente.id);
        });
    };


    this.add = function(cliente) {

        var base = AirtableService.getBase();

        return base('Clientes').create({
            "Nombre": cliente.Nombre,
            "Email": cliente.Email,
            "FechaNacimiento": cliente.Birthdate,
            "Telefono": cliente.Telefono
        });
    }

}]); // fin de Clientes Service

app.service('CitasService', ['AirtableService', function(AirtableService) {
    this.getAll = function() {

		var base = AirtableService.getBase();
		
		return base('Citas').select({
			view: 'Grid view'
		}).all();
    };

    this.getByDate = function (fecha) {
        
        var base = AirtableService.getBase();

        var date = (new Date(fecha)).toISOString().split('T')[0];

        return base('Citas').select({
            view: 'Grid view', 
            filterByFormula: 'AND( IS_AFTER(Fecha, "'+date+'T00:00:00.000Z"), IS_BEFORE(Fecha, "'+date+'T23:59:00.000Z" ))'
        }).all();
    }

    this.getById = function (id) {
        
        var base = AirtableService.getBase();
        
        return base('Citas').find(id);
    }

    this.getBeforeToday = function () {

        var base = AirtableService.getBase();
        var today = (new Date());
        
        var query = 'AND(IS_BEFORE(Fecha, "'+today+'"), TrabajoRealizado=1)';
        
        return base('Citas').select({
          view: 'Grid view',
          filterByFormula: query
        }).all();
    }

    this.borrar = function(cita) {

        var base = AirtableService.getBase();
        
        return base('Citas').destroy(cita);
    };

    this.add = function(cita) {

        var base = AirtableService.getBase();

        return base('Citas').create({
            "Fecha": cita.fecha,
            "Comentarios": cita.Comentarios,
            "Cliente": [cita.Cliente.id],
            "Vehiculo": [cita.Vehiculo.id],
            "TipoServicio": [cita.TipoServicio]
        });
    };

    this.ordenarCitas = function() {

        var base = AirtableService.getBase();

        return base('Citas').select({
            sort: [
                {field: 'Fecha', direction: 'desc'}
            ],
        }).all();
    };

}]); // fin de Citas Service

app.service('ServiciosService', ['AirtableService', function(AirtableService) {
        this.getAll = function() {
        
        var base = AirtableService.getBase();
        
        return base('Servicios').select({
        }).all();
    };
}]); // fin de Servicios Service


app.service('UsuariosService', ['AirtableService', function(AirtableService) {

    this.getUser = function(email) {
        
        var base = AirtableService.getBase();
        
        return base('Usuarios').select({
            view: 'Grid view',
            filterByFormula: '(email = "'+email+'")'
        }).all();
    };

}]); // fin de Usuarios Service


app.controller('InicioSesionCtrl', ['$scope', '$rootScope', 'UsuariosService', "authFact", "$location", function ($scope, $rootScope, UsuariosService, authFact, $location) {

    $scope.usuario = {};
    $rootScope.isAuthorized = false;
    $scope.malaAutenticacion = false;

    $scope.checkUsuario = function() {
        UsuariosService.getUser($scope.usuario.email).then(function(value){
            if (value.length > 0) {
                if (value[0].fields.password == $scope.usuario.password) {
                    authFact.setAccessToken(value[0].fields.user);

                    $location.path("/citas");
                    $rootScope.isAuthorized = true;
                    $scope.$apply();
                }
                else {
                    $scope.malaAutenticacion = true;
                    $scope.usuario.password = '';
                }
            } else {
                $scope.malaAutenticacion = true;
                $scope.usuario.email = '';
                $scope.usuario.password = '';
            }
            $scope.$apply();
        });
    }

}]);


app.controller('InicioCtrl', ['$scope', function ($scope) {

}]);
app.controller('CitasCtrl', ['$scope', 'CitasService', '$location', '$route', function ($scope, CitasService, $location, $route) {
	$scope.citaABorrar = [];
    $scope.citaAEditar = [];
    $scope.citas = [];
	CitasService.ordenarCitas().then(function(value){
		value.forEach(function(item, index){
            item.fields.id = item.id;
			$scope.citas.push(item.fields);
		});
		$scope.$apply();
	});

    $scope.eliminar = function(cita) {
        $scope.citaABorrar = cita;
        var confirmBorrar = confirm("Está seguro que desea borrar la cita?");
        if (confirmBorrar) {
            CitasService.borrar(cita.id).then(function(){
                alert("Cita eliminada");
                $location.path( '/citas' );
            });
        }
        
        //CitasService.getAll();
        //$scope.$apply();
    }

}]); // fin de Citas Ctrl

app.controller('CitaCtrl', ['$scope', 'ClientesService', 'CitasService', 'ServiciosService', 'VehiculosService', '$route', '$routeParams', '$rootScope', '$location', 
    function ($scope, ClientesService, CitasService, ServiciosService, VehiculosService, $route, $routeParams, $rootScope, $location) {

    $scope.isContenidoCargado = false;

    $scope.citaNueva;
    $scope.cita = {};
    $scope.servicios = [];
    $scope.horas = [];
    $scope.listaClientes = [];
    $scope.listaVehiculos = [];
    $scope.horaNueva = 0;

    var param = $routeParams.id;

    setTimeout(function() {
        $scope.servicios = $rootScope.LISTA_SERVICIOS;
        $scope.$apply();

        $scope.crearHoras();
        if(param) {
            $scope.cargarCita();
        } else {
            $scope.cargarCitaNueva();
            $scope.cargarClientes();
        }
        $scope.$apply();
    }, 1500);
    
    $scope.cargarCitaNueva = function() {
        $scope.citaNueva = {};
    }

    $scope.cargarClientes = function() {
        ClientesService.getAll().then(function(value) {
            $scope.listaClientes = value;
            $scope.isContenidoCargado = true;
            $scope.$apply();
        });
    }

    $scope.cargarVehiculos = function() {
        VehiculosService.getAll($scope.citaNueva.Cliente.fields.Cliente).then(function(value){
            $scope.listaVehiculos = value;
            $scope.$apply();
        });
    }

    $scope.cargarCita = function() { 
        CitasService.getById(param).then(function(value) {
            var fechaFormat = new Date(value.fields.Fecha);
            value.fields.Fecha = fechaFormat;
            value.fields.TipoServicio = value.fields.TipoServicio[0];
            $scope.HoraActual = fechaFormat.getHours() +':'+ ('0'+fechaFormat.getMinutes()).slice(-2);
            $scope.FechaNormal = fechaFormat.getDate()+'/'+(fechaFormat.getMonth()+1)+'/'+fechaFormat.getFullYear();
            $scope.horaNueva = $scope.HoraActual;
            $scope.cita = value;
            $scope.$apply();
            $scope.cargarHoras($scope.cita.fields.Fecha);
        });
    }

    $scope.crearHoras = function(){
        $scope.horas = [];
        for (var i = 7; i < 18; i++) {
            $scope.horas.push( {
              hora: i+':00',
              disponible: true
            });
            $scope.horas.push( {
              hora: i+':30',
              disponible: true
            });
        }
    }

    $scope.cargarHoras = function(pfecha) {
        CitasService.getByDate(pfecha).then(function(value){
            value.forEach(function(item, index){
                var fechaCompl = new Date(item.fields.Fecha);
                var hora = fechaCompl.getHours() +':'+ ('0'+fechaCompl.getMinutes()).slice(-2);
                var timeReq = $scope.getTiempoServicio(item.fields.Tipo[0]);
//                $scope.setNoDisponible( hora, timeReq );
            });
            $scope.isContenidoCargado = true;
            $scope.$apply();
        });
    }

    $scope.getTiempoServicio = function(tipo) {
        var tiempoRequerido = 0;
        
        $scope.servicios.forEach(function(item, index) {
            if(item.fields.Nombre === tipo) {
                tiempoRequerido = item.fields.EspaciosRequeridos;
                return;
            }
        });

        return tiempoRequerido;
    }

    $scope.setNoDisponible = function(hora, timeReq) {
        for (var i=0; i < $scope.horas.length; i++) {
            if ( $scope.horas[i].hora === hora ) {
                $scope.horas[i].disponible = false;
                if ( timeReq > 1) {
                    $scope.horas[i+1].disponible = false;
                    $scope.horas[i+2].disponible = false;
                }
            }
        }
    }

    $scope.add = function(pCompletar) {
        var horas = $scope.horaNueva.split(':')[0];
        var minutos = $scope.horaNueva.split(':')[1];
        if (param) {
            $scope.cita.fields.Fecha.setHours(horas,minutos,0,0);
            delete $scope.cita.fields.NombreCliente;
            delete $scope.cita.fields.DetalleVehiculo;
            delete $scope.cita.fields.placa;
            delete $scope.cita.fields.Tipo;
            $scope.cita.fields.TipoServicio = [$scope.cita.fields.TipoServicio];
            if (pCompletar) {
                $scope.cita.fields.TrabajoRealizado = pCompletar;
            }
            $scope.cita.save().then(function(value){
                if (value) {
                  alert('Cita guardada!');
                } else {
                  console.log(value);
                }
            });
        } else {
            $scope.citaNueva.fecha.setHours(horas,minutos,0,0);
            CitasService.add($scope.citaNueva).then(function(value){
                if (value.id) {
                    alert("Cita agregada con éxito");
                } else {
                    alert('Error al crear la cita');
                    console.log(value);
                }
            });
        }
        $location.path( '/citas' );
    }

    $scope.cambioFecha = function(pfecha) {
        $scope.crearHoras();
        $scope.cargarHoras(pfecha);

    }

    $scope.completarCita = function() {
        $scope.add(true);
    }

}]);   // fin de Cita Ctrl

app.controller('DetalleCitaCtrl', ['$scope', function ($scope) {

}]);

app.controller('ClienteCtrl', ['$scope', 'ClientesService', function ($scope, ClientesService) {
    $scope.citaAEditar = [];
    $scope.Clientes = [];

    ClientesService.getAll().then(function(value){
        value.forEach(function(item, index){
            item.fields.id = item.id;
            $scope.Clientes.push(item.fields);
        });
        $scope.$apply();
    });

    $scope.eliminar = function(cliente) {
        var confirmBorrar = confirm("Está seguro que desea borrar?");
        if (confirmBorrar) {
            ClientesService.delete(cliente.id);
            alert("Cliente eliminado");
        }
    }

}]);

app.controller('AgregarClienteCtrl', ['$scope', 'ClientesService', '$location', function ($scope, ClientesService, $location) {
    $scope.cliente = {};
    $scope.telRegex = '\\+*[\\d-\\s]{8,}';

    $scope.add = function() {
        $scope.cliente.Birthdate = $scope.cliente.FechaNacimiento.getFullYear()+'/'
            +($scope.cliente.FechaNacimiento.getMonth()+1)+'/'
            +$scope.cliente.FechaNacimiento.getDate();
        ClientesService.add($scope.cliente).then(function(value){
            if (value.id) {
                $location.path( '/cliente/' + value.id );
                $scope.$apply();
            }
        });
    }

}]);

app.controller('EditarClienteCtrl', ['$scope', 'ClientesService', 'VehiculosService', '$route', '$routeParams', function ($scope, ClientesService, VehiculosService, $route, $routeParams) {
    $scope.cliente = {};
    $scope.vehiculos = [];
    $scope.nuevoVehiculo = {};
    $scope.agregandoVehiculo = false;
    $scope.telRegex = '\\+*[\\d-\\s]{8,}';
    var param = $routeParams.id;

    ClientesService.getById(param).then(function(value){
        value.fields.FechaNacimiento = new Date(value.fields.FechaNacimiento);
        $scope.cliente = value;
        $scope.$apply();
        $scope.cargarVehiculos();
    });

    $scope.addVehiculo = function() {
        $scope.nuevoVehiculo.clienteid = $scope.cliente.id;
        VehiculosService.add($scope.nuevoVehiculo).then(function(value){
            if (value.id) {
                $scope.nuevoVehiculo = {};
                $scope.cargarVehiculos();
                $scope.agregandoVehiculo = false;
            }
           $scope.$apply();
        });
    }

    $scope.cargarVehiculos = function() {
        VehiculosService.getAll($scope.cliente.fields.Cliente).then(function(value){
            $scope.vehiculos = value;
            $scope.$apply();
        });
    }

    $scope.editar = function() {
        delete $scope.cliente.fields.Cliente; 
        $scope.cliente.save().then(function(value){
            if (value) {
              alert('Cliente guardado!');  
            } else {
              console.log(value);
            }
        });;
    }

}]); // fin de EditarClienteCtrl

app.controller('PosiblesProximosCambiosCtrl', ['$scope', 'CitasService', 'ClientesService', function ($scope, CitasService, ClientesService) {
    $scope.resultado = [];
    $scope.isContenidoCargado = false;
    var citasRecurrentes = {};
    var single;
    var multiple;
    var placa;
    var tempCitas; 
    var listaClientes = {};

    ClientesService.getAll().then(function(value) {
        listaClientes = value;
    });

    $scope.generarLista = function() {
        citasRecurrentes = {};
        single = [];
        multiple = [];
        tempCitas = {};
        
        CitasService.getBeforeToday().then(function(value){
            value.forEach(function(item, index){
                placa = item.fields.placa[0];
                if ( single.indexOf(placa) === -1 ) {
                    single.push(placa);
                    tempCitas[placa] = item;
                } else {
                    if ( multiple.indexOf(placa) === -1 ) {
                        multiple.push(placa);
                        citasRecurrentes[ placa ] = [];
                        citasRecurrentes[ placa ].push(tempCitas[placa]);
                            
                    }
                    citasRecurrentes[ placa ].push(item);
                }
            });

            var index_placa;
            multiple.forEach(function(item){
                index_placa = single.indexOf(item);
                if ( index_placa > -1 ) {
                    single.splice(index_placa, 1);
                }
            });

            var citas;
            var promedios;
            var timeDiff;
            var promedioCambio;
            var proximaFecha;

            multiple.forEach(function(placa, i) {
                promedios = 0;
                citas = citasRecurrentes[placa];
                citas.forEach(function(cita, j) {
                    if ( (j+1) < citas.length ) {
                        timeDiff = Math.abs((new Date (citas[j+1].fields.Fecha)).getTime() - (new Date(cita.fields.Fecha)).getTime());
                        promedios+= (timeDiff / (1000 * 3600 * 24));
                    }
                });
                promedioCambio = Math.ceil(promedios/(citas.length-1));
                proximaFecha = new Date( (new Date()).getTime() + (promedioCambio * 24 * 3600 * 1000) );
                
                listaClientes.forEach(function(cliente) {
                    if ( citas[0].fields.Cliente == cliente.id ) {
                        $scope.resultado.push( {    
                            proximaFecha : proximaFecha,
                            promedioCambio : promedioCambio,
                            nombreCliente : cliente.fields.Nombre,
                            telefonoCliente : cliente.fields.Telefono,
                            emailCliente : cliente.fields.Email,
                            detalleVehiculo : citas[0].fields.DetalleVehiculo,
                            placa : citas[0].fields.placa
                        });
                    }
                });
            });

            promedioCambio = 90;
            single.forEach(function(placa, i) {
                citas = tempCitas[placa];
                proximaFecha = new Date( (new Date()).getTime() + (promedioCambio * 24 * 3600 * 1000) );
                listaClientes.forEach(function(cliente) {
                    if (citas.fields.Cliente[0] == cliente.id) {
                        $scope.resultado.push( {    
                            proximaFecha: proximaFecha,
                            promedioCambio : promedioCambio,
                            nombreCliente : cliente.fields.Nombre,
                            telefonoCliente : cliente.fields.Telefono,
                            emailCliente : cliente.fields.Email,
                            detalleVehiculo : citas.fields.DetalleVehiculo,
                            placa : citas.fields.placa
                        });
                    }
                });
            });

            $scope.isContenidoCargado = true;
            $scope.$apply();
        });
    } // fin de funcion generarLista

}]); // fin de PosiblesProximosCambiosCtrl
