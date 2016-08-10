define(function(require) {
    'use strict';

    var $ = require('jquery'),
        _ = require('underscore'),
        Marionette = require('marionette'),

        Utils = require('utils/utils'),
        downloadDataTemplate = require('text!learners/common/templates/download-data.underscore'),
        DownloadDataView;

    DownloadDataView = Marionette.ItemView.extend({
        template: _.template(downloadDataTemplate),

        ui: {
            dataDownloadButton: '.action-download-data'
        },

        initialize: function(options) {
            var splitUrl;
            this.options = _.extend({
                trackCategory: 'download-data',
                downloadDataTitle: gettext('Download CSV'),
                downloadDataMessage: gettext('Download search results to CSV')
            }, options);

            // Parse the download_url, if given, into URL and query params
            if (this.options.collection && !_.isEmpty(this.options.collection.download_url)) {
                splitUrl = this.options.collection.download_url.split('?', 2);
                this.download_base_url = splitUrl[0];
                this.download_params = Utils.parseQueryString(splitUrl[1]);
                this.download_params.course_id = this.options.collection.courseId;
            }

            // Update the href on the download button when the collection changes.
            this.listenTo(this.options.collection, 'sync', this.updateDownloadLink);
        },

        onShow: function() {
            // Update the download button href on template load
            this.updateDownloadLink();
        },

        templateHelpers: function() {
            var hasDownloadData = !_.isEmpty(this.download_base_url);
            return {
                hasDownloadData: hasDownloadData,
                downloadDataTitle: this.options.downloadDataTitle,
                downloadDataMessage: this.options.downloadDataMessage,
                trackCategory: this.options.trackCategory
            };
        },

        getDownloadUrl: function() {
            var queryParams = {},
                orderedParams = [];

            // Return empty string if no download_base_url
            if (_.isEmpty(this.download_base_url)) {
                return '';
            }

            // Assemble a sorted list of query parameters from the active filters
            _.extend(queryParams, this.download_params,
                                  this.options.collection.getActiveFilterFields(true));
            orderedParams = Object.keys(queryParams).sort().map(function(key) {
                return {key: key, val: queryParams[key]};
            });

            return this.download_base_url + Utils.toQueryString(orderedParams);
        },

        updateDownloadLink: function() {
            // Set the href for the download button to the current download URL
            $(this.ui.dataDownloadButton).attr('href', this.getDownloadUrl());
        }
    });

    return DownloadDataView;
});

