var app = angular.module("lubricentro", ["ui.bootstrap", "ngRoute"]);

app.constant('AIRTABLE_KEY', 'keycS5NvHoRLPCVdl');

app.config(function($routeProvider) {
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
        controller: "CitasCtrl"
    })
    .when("/cita:id", {
        templateUrl : "templates/detalle-cita.htm",
        controller: "DetalleCitaCtrl"
    })
    .when("/citas/editar/:id", {
        templateUrl : "templates/formulario-cita.htm",
        controller: "CitaCtrl"
    })
    .when("/citas/completar/:id", {
        templateUrl : "templates/completar-cita.htm",
        controller: "CitaCtrl"
    })
    .when("/citas/agregar", {
        templateUrl : "templates/formulario-cita.htm",
        controller: "CitaCtrl"
    })

    .when("/clientes", {
        templateUrl : "templates/clientes.htm",
        controller: "ClienteCtrl"
    })
    .when("/cliente/agregar", {
        templateUrl : "templates/agregar-cliente.htm",
        controller: "AgregarClienteCtrl"
    })
    .when("/cliente/:id", {
        templateUrl : "templates/editar-cliente.htm",
        controller: "EditarClienteCtrl"
    })

    .when("/posibles-proximos-cambios", {
        templateUrl : "templates/posibles-proximos-cambios.htm",
        controller: "PosiblesProximosCambiosCtrl"
    })
    .when("/reportes", {
        templateUrl : "templates/reportes.htm",
        controller: "ReportesCtrl"
    });
});

app.run([ '$rootScope', 'ServiciosService',function($rootScope, ServiciosService) {
    
    ServiciosService.getAll().then(function(value){
        $rootScope.LISTA_SERVICIOS = value;
    });

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
            filterByFormula: '({Fecha} > "'+date+'T00:00:00.000Z" & {Fecha} < "'+date+'T23:59:00.000Z" )'
        }).all();
    }

    this.getById = function (id) {
        
        var base = AirtableService.getBase();
        
        return base('Citas').find(id);
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

}]); // fin de Citas Service

app.service('ServiciosService', ['AirtableService', function(AirtableService) {
        this.getAll = function() {
        
        var base = AirtableService.getBase();
        
        return base('Servicios').select({
        }).all();
    };
}]); // fin de Servicios Service

app.controller('InicioSesionCtrl', ['$scope', function ($scope) {

}]);
app.controller('InicioCtrl', ['$scope', function ($scope) {

}]);
app.controller('CitasCtrl', ['$scope', 'CitasService', '$location', '$route', function ($scope, CitasService, $location, $route) {
	$scope.citaABorrar = [];
    $scope.citaAEditar = [];
    $scope.citas = [];
	CitasService.getAll().then(function(value){
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
            console.log(cita.id);
            CitasService.borrar(cita.id).then(function(){
                alert("Cita eliminada");
                $route.reload();  
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
                $scope.setNoDisponible( hora, timeReq );
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
            delete $scope.cita.fields.Tipo;
            $scope.cita.fields.TipoServicio = [$scope.cita.fields.TipoServicio];
            if (pCompletar) {
                $scope.cita.fields.TrabajoRealizado = pCompletar;
            }
            $scope.cita.save();
            console.log('Cita guardada!');
        } else {
            $scope.citaNueva.fecha.setHours(horas,minutos,0,0);
            console.log($scope.citaNueva);
            CitasService.add($scope.citaNueva).then(function(value){
                if (value.id) {
                    console.log("Cita agregada con éxito");
                }
                console.log(value);
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
        console.log($scope.cita);
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
            console.log(cliente.id);
            ClientesService.delete(cliente.id);
            alert("Cliente eliminado");
        }
    }

}]);

app.controller('AgregarClienteCtrl', ['$scope', 'ClientesService', '$location', function ($scope, ClientesService, $location) {
    $scope.cliente = {};

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
        //$scope.cliente.fields.Fecha.setHours(horas,minutos,0,0);
        delete $scope.cliente.fields.Cliente;
        console.log($scope.cliente);
        //var fechaFormat = new Date($scope.cliente.fields.FechaNacimiento);
        //$scope.cliente.fields.FechaNacimiento = fechaFormat.getFullYear()+'-'+
        //            ('0'+(fechaFormat.getMonth()+1)).slice(-2)+'-'+('0'+fechaFormat.getDate()).slice(-2);
        $scope.cliente.save();
        //$scope.$apply();
        //console.log($scope.cliente);
    }

}]);    

app.controller('PosiblesProximosCambiosCtrl', ['$scope', function ($scope) {
    
}]);
app.controller('ReportesCtrl', ['$scope', function ($scope) {

}]);



/*
* Login
* Lista de Cliente
   - Agregar, Eliminar
* Detalle de cita / Registro de Trabajo Realizado
   - Editar o Eliminar
   - Registrar Kilometraje, Comentarios
* Posibles Próximos Cambios de Aceite
   - Muestra posibles cambios de aceite para una fecha determinada
* Reportes estadísticos
*/