﻿angular.module("umbraco").controller("EventCalendar.REventEditController",
        function ($scope, $routeParams, reventResource, locationResource, notificationsService, navigationService, assetsService, userService, entityResource, dialogService) {

            $scope.event = { id: 0, calendarid: 0, allDay: false, organisator: {} };

            var initAssets = function () {
                assetsService.loadCss("/App_Plugins/EventCalendar/css/bootstrap-switch.min.css");
                assetsService.loadCss("/App_Plugins/EventCalendar/css/eventcalendar.custom.css");
                assetsService.loadCss("/App_Plugins/EventCalendar/css/bootstrap-tagsinput.css");

                //Get the current user locale
                userService.getCurrentUser().then(function (user) {
                    locale = user.locale;

                    //Load js library add set the date values for starttime/endtime
                    assetsService
                        .loadJs("/App_Plugins/EventCalendar/scripts/moment-with-locales.js")
                        .then(function () {
                            //Set the right local of the current user in moment
                            moment.locale([locale, 'en']);

                            if ($routeParams.create == "true") {
                                $scope.event.starttime = moment();
                                $scope.event.endtime = moment();
                            }

                            assetsService
                               .loadJs("/App_Plugins/EventCalendar/scripts/bootstrap-datetimepicker.js")
                               .then(function () {
                                   //this function will execute when all dependencies have loaded
                                   $('#datetimepicker1').datetimepicker({
                                       language: locale,
                                       pickDate: false
                                   });
                                   $('#datetimepicker1 input').val(moment.utc($scope.event.starttime).format('LT'));

                                   $('#datetimepicker2').datetimepicker({
                                       language: locale,
                                       pickDate: false
                                   });
                                   $('#datetimepicker2 input').val(moment.utc($scope.event.endtime).format('LT'));

                                   $('#datetimepicker1').on('dp.change', function (e) {
                                       var d = moment(e.date); //.format('MM/DD/YYYY HH:mm:ss');
                                       console.log(d);
                                       //$('#datetimepicker1 input').val(d.format('l LT'));
                                       $scope.event.starttime = d.format('HH:mm:ss');
                                   });
                                   $('#datetimepicker2').on('dp.change', function (e) {
                                       var d = moment(e.date);
                                       console.log(d);
                                       //$('#datetimepicker2 input').val(d.format('l LT'));
                                       $scope.event.endtime = d.format('HH:mm:ss');
                                   });
                               });
                        });

                    assetsService
                    .loadJs("/App_Plugins/EventCalendar/scripts/bootstrap-tagsinput.min.js")
                    .then(function () {
                        $('input#tags').tagsinput();
                        $('input#tags').on('itemAdded', function (event) {
                            // event.item: contains the item
                            if ($scope.event.categories === "") {
                                $scope.event.categories += event.item;
                            } else {
                                $scope.event.categories += "," + event.item;
                            }
                        });
                    });

                    assetsService
                        .loadJs("/App_Plugins/EventCalendar/scripts/bootstrap-switch.min.js")
                        .then(function () {
                            $('#allday').bootstrapSwitch({
                                onColor: "success",
                                onText: "<i class='icon-check icon-white'></i>",
                                offText: "<i class='icon-delete'></i>",
                                onSwitchChange: function (event, state) {
                                    $scope.event.allday = state;
                                }
                            });
                        });
                });                
            };

            var initRTE = function () {                
                //Create the tabs for every language etc
                $scope.tabs = [{ id: "Content", label: "Content" }];
                angular.forEach($scope.event.descriptions, function (value, key) {
                    this.push({ id: key, label: value.culture });
                }, $scope.tabs);

                //Update descriptions with data for rte
                angular.forEach($scope.event.descriptions, function (description) {
                    description.label = '';
                    description.description = '';
                    description.view = 'rte';
                    description.hideLabel = true;
                    description.config = {
                        editor: {
                            toolbar: ["code", "undo", "redo", "cut", "styleselect", "bold", "italic", "alignleft", "aligncenter", "alignright", "bullist", "numlist", "link", "umbmediapicker", "umbmacro", "table", "umbembeddialog"],
                            stylesheets: [],
                            dimensions: { height: 400, width: '100%' }
                        }
                    };
                });
            };

            //Load all locations
            locationResource.getall().then(function (response) {
                $scope.locations = response.data;
            }, function (response) {
                notificationsService.error("Error", "Could not load locations");
            });

            reventResource.getDayOfWeekValues().then(function (response) {
                $scope.DayOfWeekList = response.data;
            });

            reventResource.getFrequencyTypes().then(function (response) {
                $scope.FrequencyTypes = response.data;
            });

            reventResource.getMonthlyIntervalValues().then(function (response) {
                $scope.MonthlyIntervals = response.data;
            });

            $scope.populate = function (data) {
                $scope.event.organisator_id = data.id;
                $scope.event.organisator = { name: data.name, id: data.id, icon: data.icon };
            };

            $scope.openMemberPicker = function () {
                dialogService.memberPicker({
                    multiPicker: false,
                    callback: $scope.populate
                });
            };

            $scope.deleteOrganisator = function () {
                $scope.event.organisator = {};
            }

            if ($routeParams.create == "true") {
                $scope.event.calendarid = $routeParams.id.replace("c-", "");
                initAssets();
            } else {
                //get a calendar id -> service
                reventResource.getById($routeParams.id.replace("re-", "")).then(function (response) {
                    $scope.event = response.data;
                    $scope.event.organisator = {};

                    initRTE();

                    initAssets();

                    if ($scope.event.organisator_id != 0) {
                        entityResource.getById($scope.event.organisator_id, "Member")
                           .then(function (data) {
                               $scope.event.organisator = { name: data.name, id: data.id, icon: data.icon };
                           });
                    }

                }, function (response) {
                    notificationsService.error("Error", $scope.currentNode.name + " could not be loaded");
                });
            }

            $scope.save = function (event) {
                reventResource.save(event).then(function (response) {
                    if ($routeParams.create == "true") {
                        window.location = "#/eventCalendar/ecTree/editREvent/" + response.data.id;
                    }
                    navigationService.syncTree({ tree: 'ecTree', path: ["-1", "calendarTree", "c-" + $scope.event.calendarid], forceReload: true });
                    notificationsService.success("Success", event.title + " has been saved");
                }, function (response) {
                    notificationsService.error("Error", event.title + " could not be saved");
                });
            };

        });