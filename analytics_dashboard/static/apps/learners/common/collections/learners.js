define(function(require) {
    'use strict';

    var PagingCollection = require('uitk/pagination/paging-collection'),
        LearnerModel = require('learners/common/models/learner'),
        LearnerUtils = require('learners/common/utils'),
        Utils = require('utils/utils'),
        _ = require('underscore'),

        LearnerCollection;

    LearnerCollection = PagingCollection.extend({
        model: LearnerModel,

        initialize: function(models, options) {
            PagingCollection.prototype.initialize.call(this, options);

            this.url = options.url;
            this.download_url = options.download_url;
            this.courseId = options.courseId;

            this.registerSortableField('username', gettext('Name (Username)'));
            this.registerSortableField('problems_attempted', gettext('Problems Tried'));
            this.registerSortableField('problems_completed', gettext('Problems Correct'));
            this.registerSortableField('problem_attempts_per_completed', gettext('Attempts per Problem Correct'));
            this.registerSortableField('videos_viewed', gettext('Videos'));
            this.registerSortableField('discussion_contributions', gettext('Discussions'));

            this.registerFilterableField('segments', gettext('Segments'));
            this.registerFilterableField('ignore_segments', gettext('Segments to Ignore'));
            this.registerFilterableField('cohort', gettext('Cohort'));
            this.registerFilterableField('enrollment_mode', gettext('Enrollment Mode'));
        },

        fetch: function(options) {
            return PagingCollection.prototype.fetch.call(this, options)
                .fail(LearnerUtils.handleAjaxFailure.bind(this));
        },

        state: {
            pageSize: 25
        },

        queryParams: {
            course_id: function() { return this.courseId; }
        },

        // Shim code follows for backgrid.paginator 0.3.5
        // compatibility, which expects the backbone.pageable
        // (pre-backbone.paginator) API.
        hasPrevious: function() {
            return this.hasPreviousPage();
        },

        hasNext: function() {
            return this.hasNextPage();
        },

        /**
         * The following two methods encode and decode the state of the collection to a query string. This query string
         * is different than queryParams, which we send to the API server during a fetch. Here, the string encodes the
         * current user view on the collection including page number, filters applied, search query, and sorting. The
         * string is then appended on to the fragment identifier portion of the URL.
         *
         * e.g. http://.../learners/#?text_search=foo&sortKey=username&order=desc&page=1
         */

        // Encodes the state of the collection into a query string that can be appended onto the URL.
        getQueryString: function() {
            var params = this.getActiveFilterFields(true),
                orderedParams = [];

            // Order the parameters: filters & search, sortKey, order, and then page.

            // Because the active filter fields object is not ordered, these are the only params of orderedParams that
            // don't have a defined order besides being before sortKey, order, and page.
            _.mapObject(params, function(val, key) {
                orderedParams.push({key: key, val: val});
            });

            if (this.state.sortKey !== null) {
                orderedParams.push({key: 'sortKey', val: this.state.sortKey});
                orderedParams.push({key: 'order', val: this.state.order === 1 ? 'desc' : 'asc'});
            }
            orderedParams.push({key: 'page', val: this.state.currentPage});
            return Utils.toQueryString(orderedParams);
        },

        /**
         * Decodes a query string into arguments and sets the state of the collection to what the arguments describe.
         * The query string argument should have already had the prefix '?' stripped (the AppRouter does this).
         *
         * Will set the collection's isStale boolean to whether the new state differs from the old state (so the caller
         * knows that the collection is stale and needs to do a fetch).
         */
        setStateFromQueryString: function(queryString) {
            var params = Utils.parseQueryString(queryString),
                order = -1,
                page, sortKey;

            _.mapObject(params, function(val, key) {
                if (key === 'page') {
                    page = parseInt(val, 10);
                    if (page !== this.state.currentPage) {
                        this.isStale = true;
                    }
                    this.state.currentPage = page;
                } else if (key === 'sortKey') {
                    sortKey = val;
                } else if (key === 'order') {
                    order = val === 'desc' ? 1 : -1;
                } else {
                    if (key in this.filterableFields || key === 'text_search') {
                        if (val !== this.getFilterFieldValue(key)) {
                            this.isStale = true;
                        }
                        this.setFilterField(key, val);
                    }
                }
            }, this);

            // Set the sort state if sortKey or order from the queryString are different from the current state
            if (sortKey && sortKey in this.sortableFields) {
                if (sortKey !== this.state.sortKey || order !== this.state.order) {
                    this.isStale = true;
                    this.setSorting(sortKey, order);
                }
            }
        }
    });

    return LearnerCollection;
});
