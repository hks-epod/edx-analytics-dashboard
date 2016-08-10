define(function(require) {
    'use strict';

    var DownloadDataView = require('learners/common/views/download-data'),
        LearnerCollection = require('learners/common/collections/learners');

    describe('DownloadDataView', function() {
        beforeEach(function() {
            this.user = {
                last_updated: new Date(2016, 1, 28)
            };
        });

        it('has default options', function() {
            var downloadDataView = new DownloadDataView({});
            var templateVars = downloadDataView.templateHelpers();
            expect(templateVars.hasDownloadData).toBe(false);
            expect(templateVars.trackCategory).toBe('download-data');
            expect(templateVars.downloadDataTitle).toBe('Download CSV');
            expect(templateVars.downloadDataMessage).toBe('Download search results to CSV');
        });

        it('accepts options overrides', function() {
            var downloadDataView = new DownloadDataView({
                hasDownloadData: true,
                trackCategory: 'tracking-my-downloads',
                downloadDataTitle: 'Download My CSV',
                downloadDataMessage: 'Download my search results'
            });
            var templateVars = downloadDataView.templateHelpers();
            expect(templateVars.hasDownloadData).toBe(false);
            expect(templateVars.trackCategory).toBe('tracking-my-downloads');
            expect(templateVars.downloadDataTitle).toBe('Download My CSV');
            expect(templateVars.downloadDataMessage).toBe('Download my search results');
        });

        it('must have a download_url to display the download button', function() {
            // Collections without download_url get no download button
            var downloadDataView = new DownloadDataView({
                collection: new LearnerCollection(
                    [this.user],
                    {url: 'http://example.com'}
                )
            });
            var templateVars = downloadDataView.templateHelpers();
            expect(downloadDataView.getDownloadUrl()).toBe('');
            expect(templateVars.hasDownloadData).toBe(false);

            // Collections with download_url get a download button
            downloadDataView = new DownloadDataView({
                collection: new LearnerCollection(
                    [this.user],
                    {
                        url: 'http://example.com',
                        download_url: '/learners.csv'
                    }
                )
            });
            expect(downloadDataView.getDownloadUrl()).toBe('/learners.csv?course_id=undefined');
            templateVars = downloadDataView.templateHelpers();
            expect(templateVars.hasDownloadData).toBe(true);
        });

        it('changes the download_url query string based on search filters', function() {
            // course_id but no active filters
            var collection = new LearnerCollection([this.user],
                {
                    url: 'http://example.com',
                    download_url: '/learners.csv',
                    courseId: 'course-v1:Demo:test'
                }
            );
            var downloadDataView = new DownloadDataView({
                collection: collection
            });

            expect(downloadDataView.getDownloadUrl()).toBe(
                '/learners.csv' +
                '?course_id=course-v1%3ADemo%3Atest'
            );

            // set a filter field
            collection.setFilterField('enrollment_mode', 'audit');
            expect(downloadDataView.getDownloadUrl()).toBe(
                '/learners.csv' +
                '?course_id=course-v1%3ADemo%3Atest' +
                '&enrollment_mode=audit'
            );

            // add another filter field (will maintain alphabetical order)
            collection.setFilterField('alpha', 'beta');
            expect(downloadDataView.getDownloadUrl()).toBe(
                '/learners.csv' +
                '?alpha=beta' +
                '&course_id=course-v1%3ADemo%3Atest' +
                '&enrollment_mode=audit'
            );

            // unset filter field restores original URL
            collection.unsetAllFilterFields();
            expect(downloadDataView.getDownloadUrl()).toBe(
                '/learners.csv' +
                '?course_id=course-v1%3ADemo%3Atest'
            );
        });

        it('allows query parameters to be in the download_url', function() {
            var collection = new LearnerCollection([this.user],
                {
                    url: 'http://example.com',
                    download_url: '/learners.csv?fields=abc,def&other=ghi',
                    courseId: 'course-v1:Demo:test'
                }
            );
            var downloadDataView = new DownloadDataView({
                collection: collection
            });

            // query string parameters will be sorted alphabetically
            expect(downloadDataView.getDownloadUrl()).toBe(
                '/learners.csv' +
                '?course_id=course-v1%3ADemo%3Atest' +
                '&fields=abc%2Cdef' +
                '&other=ghi'
            );

            // set a filter field
            collection.setFilterField('enrollment_mode', 'audit');
            expect(downloadDataView.getDownloadUrl()).toBe(
                '/learners.csv' +
                '?course_id=course-v1%3ADemo%3Atest' +
                '&enrollment_mode=audit' +
                '&fields=abc%2Cdef' +
                '&other=ghi'
            );

            // unset filter field restores original URL
            collection.unsetAllFilterFields();
            expect(downloadDataView.getDownloadUrl()).toBe(
                '/learners.csv' +
                '?course_id=course-v1%3ADemo%3Atest' +
                '&fields=abc%2Cdef' +
                '&other=ghi'
            );
        });
    });
});
