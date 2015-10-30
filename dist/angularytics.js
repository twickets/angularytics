/**
 * The solution to tracking page views and events in a SPA with AngularJS
 * @version v0.4.0 - 2015-10-30
 * @link https://github.com/mgonto/angularytics
 * @author Martin Gontovnikas <martin@gonto.com.ar>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
// hi
(function () {
  angular.module('angularytics', []).provider('Angularytics', function () {
    var eventHandlersNames = ['Google'];
    var suppressPages = [];
    this.setEventHandlers = function (handlers) {
      if (angular.isString(handlers)) {
        handlers = [handlers];
      }
      eventHandlersNames = [];
      angular.forEach(handlers, function (handler) {
        eventHandlersNames.push(capitalizeHandler(handler));
      });
    };
    this.setSuppressPages = function (pagesList) {
      if (!angular.isArray(pagesList)) {
        // Invalid logging suppression list passed to angularytics, ignoring
        return;
      }
      suppressPages = [];
      angular.forEach(pagesList, function (pg) {
        suppressPages.push(pg);
      });
    };
    var capitalizeHandler = function (handler) {
      return handler.charAt(0).toUpperCase() + handler.substring(1);
    };
    var pageChangeEvent = '$locationChangeSuccess';
    this.setPageChangeEvent = function (newPageChangeEvent) {
      pageChangeEvent = newPageChangeEvent;
    };
    var pageViewTrackingEnabled = true;
    this.disablePageViewTracking = function () {
      pageViewTrackingEnabled = false;
    };
    this.$get = [
      '$injector',
      '$rootScope',
      '$location',
      function ($injector, $rootScope, $location) {
        // Helper methods
        var eventHandlers = [];
        angular.forEach(eventHandlersNames, function (handler) {
          eventHandlers.push($injector.get('Angularytics' + handler + 'Handler'));
        });
        var forEachHandlerDo = function (action) {
          angular.forEach(eventHandlers, function (handler) {
            action(handler);
          });
        };
        var service = {};
        // Just dummy function so that it's instantiated on app creation
        service.init = function () {
        };
        service.trackEvent = function (category, action, opt_label, opt_value, opt_noninteraction) {
          forEachHandlerDo(function (handler) {
            if (category && action) {
              handler.trackEvent(category, action, opt_label, opt_value, opt_noninteraction);
            }
          });
        };
        service.trackPageView = function (url) {
          forEachHandlerDo(function (handler) {
            if (url) {
              //if (console) console.log("tracking url "+url);
              handler.trackPageView(url);
            }
          });
        };
        service.trackTiming = function (category, variable, value, opt_label) {
          forEachHandlerDo(function (handler) {
            if (category && variable && value) {
              handler.trackTiming(category, variable, value, opt_label);
            }
          });
        };
        // Event listening
        if (pageViewTrackingEnabled) {
          $rootScope.$on(pageChangeEvent, function () {
            var url = $location.url();
            for (i in suppressPages) {
              if (new RegExp(suppressPages[i]).test(url)) {
                //if (console) console.log("skipping auto tracking of url "+url);
                return;
              }
            }
            //if (console) console.log("auto tracking url "+url);
            service.trackPageView(url);
          });
        }
        return service;
      }
    ];
  });
}());
(function () {
  angular.module('angularytics').factory('AngularyticsConsoleHandler', [
    '$log',
    function ($log) {
      var service = {};
      service.trackPageView = function (url) {
        $log.log('URL visited', url);
      };
      service.trackEvent = function (category, action, opt_label, opt_value, opt_noninteraction) {
        $log.log('Event tracked', category, action, opt_label, opt_value, opt_noninteraction);
      };
      service.trackTiming = function (category, variable, value, opt_label) {
        $log.log('Timing tracked', category, variable, value, opt_label);
      };
      return service;
    }
  ]);
}());
(function () {
  angular.module('angularytics').factory('AngularyticsGoogleHandler', function () {
    var service = {};
    service.trackPageView = function (url) {
      _gaq.push([
        '_set',
        'page',
        url
      ]);
      _gaq.push([
        '_trackPageview',
        url
      ]);
    };
    service.trackEvent = function (category, action, opt_label, opt_value, opt_noninteraction) {
      _gaq.push([
        '_trackEvent',
        category,
        action,
        opt_label,
        opt_value,
        opt_noninteraction
      ]);
    };
    service.trackTiming = function (category, variable, value, opt_label) {
      _gaq.push([
        '_trackTiming',
        category,
        variable,
        value,
        opt_label
      ]);
    };
    return service;
  }).factory('AngularyticsGoogleUniversalHandler', function () {
    var service = {};
    service.trackPageView = function (url) {
      ga('set', 'page', url);
      ga('send', 'pageview', url);
    };
    service.trackEvent = function (category, action, opt_label, opt_value, opt_noninteraction) {
      ga('send', 'event', category, action, opt_label, opt_value, { 'nonInteraction': opt_noninteraction });
    };
    service.trackTiming = function (category, variable, value, opt_label) {
      ga('send', 'timing', category, variable, value, opt_label);
    };
    return service;
  });
}());
(function () {
  angular.module('angularytics').filter('trackEvent', [
    'Angularytics',
    function (Angularytics) {
      return function (entry, category, action, opt_label, opt_value, opt_noninteraction) {
        Angularytics.trackEvent(category, action, opt_label, opt_value, opt_noninteraction);
        return entry;
      };
    }
  ]);
}());