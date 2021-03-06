﻿angular.module("umbraco").controller("EventCalendar.LocationEditController",
        function ($scope, $routeParams, locationResource, notificationsService, assetsService, navigationService) {

            //get a calendar id -> service
            locationResource.getById($routeParams.id).then(function (response) {
                $scope.location = response.data;
            }, function (response) {
                notificationsService.error("Error", location.name + " could not be loaded");
            });

            assetsService.loadCss("/App_Plugins/EventCalendar/css/jquery-gmaps-latlon-picker.css");

            //assetsService
            //    .loadJs("http://maps.googleapis.com/maps/api/js?sensor=false")
            //    .then(function () {
            //        console.log("First file loaded");
            //        assetsService.loadJs("http://maps.gstatic.com/intl/de_de/mapfiles/api-3/15/1a/main.js")
            //            .then(function () {
            //                console.log("Second file loaded");
            //                assetsService
            //                .loadJs("/App_Plugins/EventCalendar/scripts/jquery-gmaps-latlon-picker.js")
            //                .then(function () {
            //                    console.log("Third file loaded");
            //                    //this function will execute when all dependencies have loaded
            //                    $(document).bind("location_changed", function (event, object) {
            //                        var lat = $(".gllpLatitude").val();
            //                        var lon = $(".gllpLongitude").val();
            //                        $scope.location.lat = lat;
            //                        $scope.location.lon = lon;
            //                    });
            //                    (new GMapsLatLonPicker()).init($(".gllpLatlonPicker"));
            //                });
            //            });
            //    });

            assetsService.loadJs('http://www.google.com/jsapi')
                .then(function () {
                    google.load("maps", "3",
                       {
                         callback: initMap,
                         other_params: "sensor=false"
                       });
                });

            function initMap() {
                //Google maps is available and all components are ready to use.
                assetsService
                    .loadJs("/App_Plugins/EventCalendar/scripts/jquery-gmaps-latlon-picker.js")
                    .then(function () {
                        //this function will execute when all dependencies have loaded
                        $(document).bind("location_changed", function (event, object) {
                            var lat = $(".gllpLatitude").val();
                            var lon = $(".gllpLongitude").val();
                            $scope.location.lat = lat;
                            $scope.location.lon = lon;
                        });
                        (new GMapsLatLonPicker()).init($(".gllpLatlonPicker"));
                    });
         
                    $('a[data-toggle="tab"]').on('shown', function (e) {
                        google.maps.event.trigger(map, 'resize');
                    });
            }

            $scope.save = function (location) {
                console.log(location);
                locationResource.save(location).then(function (response) {
                    $scope.location = response.data;

                    notificationsService.success("Success", location.name + " has been created");
                    //navigationService.reloadNode($scope.currentNode.parent);
                    navigationService.hideNavigation();
                }, function (response) {
                    notificationsService.error("Error", location.name + " could not be created");
                });
            };

        });