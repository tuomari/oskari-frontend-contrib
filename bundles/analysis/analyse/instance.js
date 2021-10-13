/**
 * @class Oskari.analysis.bundle.analyse.AnalyseBundleInstance
 *
 * Main component and starting point for the analysis functionality. Analyse parameters dialog
 * is a layout down tool to configure analyse parameters .
 *
 * See Oskari.analysis.bundle.analyse.AnalyseBundle for bundle definition.
 *
 */
Oskari.clazz.define(
    'Oskari.analysis.bundle.analyse.AnalyseBundleInstance',

    /**
     * @static @method create called automatically on construction
     *
     *
     */
    function () {
        this.sandbox = undefined;
        this.started = false;
        this.plugins = {};
        this.localization = undefined;
        this.analyse = undefined;
        this.buttonGroup = 'viewtools';
        this.ignoreEvents = false;
        this.dialog = undefined;
        this.analyseHandler = undefined;
        this.analyseService = undefined;
        this.isMapStateChanged = true;
        this.state = undefined;
        this.conf = {};
        this.personalDataTab = undefined;
        this._log = Oskari.log(this.getName());
        this._unsupportedWfsLayerVersions = ['2.0.0', '3.0.0'];
        this._featureSelectionService = null;
        this._WFSLayerService = null;
    }, {
        /**
         * @static @property __name
         */
        __name: 'Analyse',

        /**
         * @public @method getName
         *
         *
         * @return {String} the name for the component
         */
        getName: function () {
            return this.__name;
        },

        /**
         * @public @method getSandbox
         *
         *
         * @return {Oskari.Sandbox}
         */
        getSandbox: function () {
            return this.sandbox;
        },
        getWFSLayerService: function () {
            if (!this._WFSLayerService) {
                this._WFSLayerService = this.sandbox.getService('Oskari.mapframework.bundle.mapwfs2.service.WFSLayerService');
            }
            return this._WFSLayerService;
        },
        // FIXME:
        // change to store this.analysisLayerId, remove analysisWFSLayerId from WFSLayerService and handle selection properly
        // remove wfslayerservice.setAnalysisWFSLayerId() from every analysis component
        // remove this._WFSLayerService
        getAnalysisLayerId: function () {
            const service = this.getWFSLayerService();
            if (!service) {
                return;
            }
            return service.getAnalysisWFSLayerId();
        },
        getSelectionService: function () {
            if (!this._featureSelectionService) {
                this._featureSelectionService = this.sandbox.getService('Oskari.mapframework.service.VectorFeatureSelectionService');
            }
            return this._featureSelectionService;
        },
        getLayerIdsWithSelections: function () {
            const service = this.getSelectionService();
            if (!service) {
                return [];
            }
            return service.getLayerIdsWithSelections();
        },
        getSelectionsForLayer: function (layerId) {
            const service = this.getSelectionService();
            if (!service) {
                return [];
            }
            return service.getSelectedFeatureIdsByLayer(layerId);
        },
        emptySelections: function (layerId) {
            const service = this.getSelectionService();
            if (!service) {
                return;
            }
            return service.removeSelection(layerId);
        },

        /**
         * @public @method getLocalization
         * Returns JSON presentation of bundles localization data for current language.
         * If key-parameter is not given, returns the whole localization data.
         *
         * @param {String} key (optional) if given, returns the value for key
         *
         * @return {String/Object} returns single localization string or
         *      JSON object for complete data depending on localization
         *      structure and if parameter key is given
         */
        getLocalization: function (key) {
            if (!this._localization) {
                this._localization = Oskari.getLocalization(this.getName());
            }
            if (key) {
                return this._localization[key];
            }
            return this._localization;
        },

        /**
         * @public @method start
         * Implements BundleInstance protocol start method
         *
         *
         */
        start: function () {
            var me = this,
                conf = me.conf,
                sandboxName = (conf ? conf.sandbox : null) || 'sandbox',
                sandbox = Oskari.getSandbox(sandboxName),
                p;

            if (me.started) {
                return;
            }

            me.started = true;

            me.sandbox = sandbox;

            me.localization = Oskari.getLocalization(me.getName());

            sandbox.register(me);
            for (p in me.eventHandlers) {
                if (me.eventHandlers.hasOwnProperty(p)) {
                    sandbox.registerForEventByName(me, p);
                }
            }

            // requesthandler
            me.analyseHandler = Oskari.clazz.create(
                'Oskari.analysis.bundle.analyse.request.AnalyseRequestHandler',
                me
            );
            sandbox.requestHandler(
                'analyse.AnalyseRequest',
                me.analyseHandler
            );
            me.analyseService = Oskari.clazz.create(
                'Oskari.analysis.bundle.analyse.service.AnalyseService',
                me
            );
            sandbox.registerService(me.analyseService);

            me.mapLayerService = sandbox.getService(
                'Oskari.mapframework.service.MapLayerService'
            );

            // Let's extend UI
            var request = Oskari.requestBuilder('userinterface.AddExtensionRequest')(me);
            sandbox.request(me, request);

            // draw ui
            me._createUi();

            // Load analysis layers
            if (Oskari.user().isLoggedIn()) {
                me.analyseService.loadAnalyseLayers();
            }

            /* stateful */
            if (conf && conf.stateful === true) {
                sandbox.registerAsStateful(me.mediator.bundleId, me);
            }

            this.__addTab();
        },

        /**
         * @public @method init
         * Implements Module protocol init method - does nothing atm
         *
         *
         */
        init: function () {
            return null;
        },

        /**
         * @public @method update
         * Implements BundleInstance protocol update method - does nothing atm
         *
         *
         */
        update: function () {

        },

        /**
         * @public @method onEvent
         * Event is handled forwarded to correct #eventHandlers if found or discarded if not.
         *
         * @param {Oskari.mapframework.event.Event} event a Oskari event object
         *
         */
        onEvent: function (event) {
            var handler = this.eventHandlers[event.getName()];
            if (!handler) {
                return;
            }
            return handler.apply(this, [event]);
        },

        /**
         * Adds a tab for analysis layers in PersonalData
         */
        __addTab: function () {
            if (this.personalDataTab) {
                // already added
                return;
            }

            if (!this.sandbox.hasHandler('PersonalData.AddTabRequest')) {
                // request not ready
                return;
            }
            var reqBuilder = Oskari.requestBuilder('PersonalData.AddTabRequest');
            // Request tab to be added to personal data
            var tab = Oskari.clazz.create(
                'Oskari.mapframework.bundle.analyse.view.PersonalDataTab',
                this
            );
            this.personalDataTab = tab;
            this.sandbox.request(
                this,
                reqBuilder(
                    this.localization.personalDataTab.title,
                    tab.getContent(),
                    false,
                    'analyse'
                )
            );
        },
        /**
         * @static @property {Object} eventHandlers
         */
        eventHandlers: {
            'Personaldata.PersonaldataLoadedEvent': function (event) {
                this.__addTab();
            },
            MapLayerVisibilityChangedEvent: function (event) {
                if (this.analyse && this.analyse.isEnabled && this.isMapStateChanged) {
                    this.isMapStateChanged = false;
                    this._log.debug('ANALYSE REFRESH');
                    // this.analyse.refreshAnalyseData();
                }
            },
            AfterMapMoveEvent: function (event) {
                this.isMapStateChanged = true;
                if (this.analyse && this.analyse.isEnabled) {
                    // this.analyse.refreshAnalyseData();
                }
            },
            AfterMapLayerAddEvent: function (event) {
                this.isMapStateChanged = true;
                if (this.analyse && this.analyse.isEnabled) {
                    const maplayer = event.getMapLayer();
                    if (this.wfsLayerHasUnsupportedVersion(maplayer)) {
                        const loc = this.getLocalization('AnalyseView');
                        this.showMessage(
                            loc.error.title,
                            loc.error.not_supported_wfs_maplayer
                        );
                        this._log.warn('tried to add unsupported layer to analysis');
                    } else {
                        this.analyse.refreshAnalyseData(maplayer.getId());
                    }
                }
            },
            AfterMapLayerRemoveEvent: function (event) {
                this.isMapStateChanged = true;
                if (this.analyse && this.analyse.isEnabled) {
                    this.analyse.refreshAnalyseData();
                    // Remove the filter JSON of the layer
                    var layer = event.getMapLayer();
                    this.analyse.removeFilterJson(layer.getId());
                }
            },
            AfterChangeMapLayerStyleEvent: function (event) {
                this.isMapStateChanged = true;
                if (this.analyse && this.analyse.isEnabled) {
                    // this.analyse.refreshAnalyseData();
                }
            },
            /**
             * @method MapLayerEvent
             * @param {Oskari.mapframework.event.common.MapLayerEvent} event
             */
            MapLayerEvent: function (event) {
                this._afterMapLayerEvent(event);
            },
            /**
             * @method userinterface.ExtensionUpdatedEvent
             */
            'userinterface.ExtensionUpdatedEvent': function (event) {
                var me = this;

                if (event.getExtension().getName() !== me.getName()) {
                    // not me -> do nothing
                    return;
                }

                var isOpen = event.getViewState() !== 'close';

                me.displayContent(isOpen);
            }
        },

        wfsLayerHasUnsupportedVersion(layer){
            return layer.getLayerType() === 'wfs' && this._unsupportedWfsLayerVersions.includes(layer.getVersion());
        },
        /**
         * @public @method stop
         * Implements BundleInstance protocol stop method
         *
         *
         */
        stop: function () {
            var me = this,
                sandbox = me.sandbox(),
                p;

            if (me.analyse) {
                me.analyse.destroy();
                me.analyse = undefined;
            }
            for (p in me.eventHandlers) {
                if (me.eventHandlers.hasOwnProperty(p)) {
                    sandbox.unregisterFromEventByName(me, p);
                }
            }

            sandbox.removeRequestHandler(
                'analyse.AnalyseRequest',
                me.analyseHandler
            );
            me.analyseHandler = null;

            var request = Oskari.requestBuilder('userinterface.RemoveExtensionRequest')(me);
            sandbox.request(me, request);

            me.sandbox.unregisterStateful(me.mediator.bundleId);
            me.sandbox.unregister(me);
            me.started = false;
        },

        /**
         * @public @method startExtension
         * implements Oskari.userinterface.Extension protocol startExtension method
         * Creates a flyout
         * Oskari.analysis.bundle.analyse.Flyout
         *
         *
         */
        startExtension: function () {
            this.plugins['Oskari.userinterface.Flyout'] = Oskari.clazz.create(
                'Oskari.analysis.bundle.analyse.Flyout',
                this
            );
            this.plugins['Oskari.userinterface.Tile'] = Oskari.clazz.create(
                'Oskari.analysis.bundle.analyse.Tile',
                this
            );
        },

        /**
         * @public @method stopExtension
         * implements Oskari.userinterface.Extension protocol stopExtension method
         * Clears references to flyout and tile
         *
         *
         */
        stopExtension: function () {
            this.plugins['Oskari.userinterface.Flyout'] = null;
            this.plugins['Oskari.userinterface.Tile'] = null;
        },

        /**
         * @public @method getPlugins
         * Implements Oskari.userinterface.Extension protocol getPlugins method
         *
         *
         * @return {Object} References to flyout and tile
         */
        getPlugins: function () {
            return this.plugins;
        },

        /**
         * @public @method getTitle
         *
         *
         * @return {String} Localized text for the title of the component
         */
        getTitle: function () {
            return this.getLocalization('title');
        },

        /**
         * @public @method getDescription
         *
         *
         * @return {String} Localized text for the description of the component
         */
        getDescription: function () {
            return this.getLocalization('desc');
        },

        /**
         * @private @method _createUi
         * (re)creates the UI for "analyse" functionality
         *
         *
         */
        _createUi: function () {
            this.plugins['Oskari.userinterface.Flyout'].createUi();
            this.plugins['Oskari.userinterface.Tile'].refresh();
        },

         /**
         * @public @method enableAnalyseMode
         *
         */
        enableAnalyseMode: function() {
            const map = jQuery('#contentMap');
            map.addClass('mapAnalyseMode');
            this.sandbox.mapMode = 'mapAnalyseMode';
            // Hide flyout, it's not needed...
            jQuery(this.plugins['Oskari.userinterface.Flyout'].container).parent().parent().hide();

            // proceed with analyse view
            if (!this.analyse) {
                this.analyse = Oskari.clazz.create(
                    'Oskari.analysis.bundle.analyse.view.StartAnalyse',
                    this,
                    this.getLocalization('AnalyseView')
                );
                this.analyse.render(map);
            } else {
                // Update data UI
                this.analyse.refreshAnalyseData();
                this.analyse.refreshExtraParameters();
            }
            if (this.state) {
                this.analyse.setState(this.state);
            }
            this.analyse.show();
            this.analyse.setEnabled(true);
            this._resizeMap();
        },

        /**
         * @public @method disableAnalyseMode
         *
         */
        disableAnalyseMode: function() {
            const map = jQuery('#contentMap');
            map.removeClass('mapAnalyseMode');

            if (this.sandbox._mapMode === 'mapAnalyseMode') {
                delete this.sandbox._mapMode;
            }
            if (this.analyse) {
                // Reset tile state
                const request = Oskari.requestBuilder('userinterface.UpdateExtensionRequest')(this, 'close', this.getName());
                this.sandbox.request(this.getName(), request);
                this.analyse.setEnabled(false);
                this.analyse.hide();
            }
            this.getWFSLayerService().setAnalysisWFSLayerId(null);
            this._resizeMap();
        },
        /**
         * @private @method _resizeMap
         * Resize map to fit screen with expanded/normal sidebar
         */
        _resizeMap() {
            const reqBuilder = Oskari.requestBuilder('MapFull.MapSizeUpdateRequest');
            if (reqBuilder) {
                this.sandbox.request(this, reqBuilder(true));
            }
        },
        /**
         * @public @method displayContent
         *
         * @param {Boolean} isOpen
         *
         */
        displayContent: function (isOpen) {
            if (isOpen) {
                this.plugins['Oskari.userinterface.Flyout'].refresh();
            }
            this.sandbox.postRequestByName(
                'MapModulePlugin.ToggleFullScreenControlRequest',
                [!isOpen]
            );
        },

        /**
         * @public @method setState
         * Sets the bundle state
         * bundle documentation for details.
         *
         * @param {Object} state bundle state as JSON
         *
         */
        setState: function (state) {
            this.state = state;
        },

        /**
         * @public @method getState
         * Returns bundle state as JSON. State is bundle specific, check the
         * bundle documentation for details.
         *
         *
         * @return {Object}
         */
        getState: function () {
            var state = this.state || {};

            if (this.analyse) {
                state = this.analyse.getState();
            }

            return state;
        },

        /**
         * @public @method showMessage
         * Shows user a message with ok button
         *
         * @param {String} title popup title
         * @param {String} message popup message
         *
         */
        showMessage: function (title, message) {
            var dialog = Oskari.clazz.create(
                'Oskari.userinterface.component.Popup'
            );
            dialog.show(title, message);
            dialog.fadeout(5000);
        },

        /**
         * @private @method _afterMapLayerEvent
         *
         * @param {Object} event
         *
         */
        _afterMapLayerEvent: function (event) {
            var layerId = event.getLayerId(),
                loc = this.getLocalization('AnalyseView');
            // Let's show the user a dialog when the new analysislayer gets added to the map.
            if (event.getOperation() === 'add') {
                var layer = this.mapLayerService.findMapLayer(layerId);

                if (layer && layer.isLayerOfType('ANALYSIS')) {
                    this.showMessage(
                        loc.success.layerAdded.title,
                        loc.success.layerAdded.message.replace(/\{layer\}/, layer.getName())
                    );
                }
            }
            // maplayers changed so update the tab content in personaldata
            if (typeof this.personalDataTab !== 'undefined') {
                this.personalDataTab.update();
            }
        }
    }, {
        /**
         * @static @property {String[]} protocol
         */
        protocol: [
            'Oskari.bundle.BundleInstance',
            'Oskari.mapframework.module.Module',
            'Oskari.userinterface.Extension',
            'Oskari.userinterface.Stateful'
        ]
    }
);
