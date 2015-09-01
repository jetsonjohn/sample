/* -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
JQuery Plugin for Advanced Search in MVC Architecture
Created By : Assyst International Pvt. Ltd.(SPR\718)
Created Date : 07-JAN-2013
Modified Date : 15-MAY-2015
Version : 4.3.9
Project : PanAgro 3.1 || PanBI
Dependencies : JQuery, JQuery UI, ApplicationConstantsJS, momentJS, LanguageTranslatorJS, timepickerJS, addonJS
-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+ */

(function ($) {

    //Create widget for Advanced Search object
    $.widget('panERP.AdvanceSearch', {

        //Default values for options
        options: {
            defaultDateFormat: _app.dateTimeFormat, // Date format of JQuery calander control	
            timePickerFormat: _app.timePickerFormat,
            bodyContainer: '.dataContent',
            SaveFilterCriteriaURL: '/PanBIActions/SaveOrDeleteFilterCriteria',
            sideViewTab: '#jtableSideViewFilterTab',
            sideViewPropElement: '#divSideBySideView',
            messages: {
                saveSuccess: 'Filter query has been saved.',
                deleteSuccess: 'Filter query has been removed.',
                saveFilter: 'Save Filter',
                removeFilter: 'Remove Filter',
                selectedFields: 'Selected Fields',
                filterByFields: 'Filter By Fields',
                aggregatedFields: 'Aggregated With',
                selectAgg: '- Metrics -',
                spCap: 'Filter Summary',
                openAdFilter: 'Open Advanced Search',
                permissionWarn: "Sorry! You have insufficient privileges. Please contact the administrator.",
                sizeWarn: "Size / Interval Out Of Range. "
            },

            //Aggregate options
            aggregateDefOptions: {
                'int': { 'MIN': 'MIN', 'MAX': 'MAX', 'AVG': 'AVG' },
                'common': { 'COUNT': 'COUNT' }
            },

            //Operator for string data type
            stringFilterOperatorOptions: {
                'In': 'In',
                'NotIn': 'Not In'
            },

            //Operator for int data type
            intFilterOperatorOptions: {
                '==': '=',
                '!=': '!=',
                '<': '<',
                '>': '>',
                '>=': '>=',
                '<=': '<=',
                'Between': 'Between'
            },

            //Operator for date data type
            dateFilterOperatorOptions: {
                '==': '=',
                '!=': '!=',
                '<': '<',
                '>': '>',
                '>=': '>=',
                '<=': '<=',
                'Between': 'Between'
            },

            //Operator for foreign key(lookup) data type
            lookUpFilterOperatorOptions: {
                '==': 'In',
                '!=': 'Not In'
            },
            //Operator for Boolean data type
            booleanFilterOperatorOptions: {
                1: 'Yes',
                0: 'No'
            },

            //Events
            ShowReport: function (event, data) { },
            submittingQuery: function (event, data) { },
            cancelSubmission: function (event, data) { },
            savingFilterQuery: function (event, data) { },
            removingFilterQuery: function (event, data) { }
        },

        //Widget DOM Elements
        _$mainContainer: null,
        _$masterControlContainer: null,
        _$simpleSearchInput: null,
        _$masterFilterSelect: null,
        _$masterAggContainer: null,
        _$masterAggSelect: null,
        _$filterForm: null,
        _$filterFormContainer: null,
        _$buttonPanel: null,
        _$saveButton: null,
        _$removeButton: null,
        _$applyButton: null,
        _$clearButton: null,
        _fields: [],
        _$crudSplitBtn: null,
        _$aggForm: null,
        _$aggTermsForm: null,
        _$aggHistogramForm: null,
        _$aggDateHistogramForm: null,
        _$aggMetricsForm: null,
        _$aggTopBottomForm: null,
        _$aggFieldBlock: null,
        _$aggFormContainer: null,
        _$displayContainer: null,

        _create: function () {
            this._createMainContainer();
            this._createMasterControlContainer();
            this._createFilterForm();
            this._createAggregateContainer();
            this._createDiaplyContainer();
            this._createAggregateForm();
            this._createMasterControls();
            this._createButtonPanel();
            if (this.options.defaultLoad && this.options.defaultLoad != '0') {
                if (!this.options.aggregate) {
                    this._generateSavedQuery();
                }
                else {
                    this._generateSavedAggQuery();
                    this._generateSavedAggMetricsQuery();
                }
            } else {
                this._generateRequiredAndHiddenFields();
            }

            if (this.options.sideViewSearch) {
                this._createFilterSideViewTab();
            }

            //Load summary panel
            if (this.options.summaryPanel) {
                var jsonQuery = this._createJsonQuery(),
                jtableInstance = this._getJtableInstance();
                this._crateSummaryTable(jtableInstance, jsonQuery);
            }
        },

        _getDataId: function () {
            return $("[data-filterId]").length + 1;
        },

        _writeLog: function (p_Mesage) {
            if (window.console && !$.browser.msie) {//IE NOT SUPPORTING CONSOLE
                console.debug("Filter Says : " + p_Mesage);
            }
        },

        _performAjaxCall: function (url, postData, dataType, async, success, error) {
            try {
                $.ajax({
                    url: url,
                    type: 'POST',
                    dataType: dataType,
                    data: postData,
                    async: async,
                    success: function (data) {
                        success(data);
                    },
                    error: function (e) {
                        error(e);
                    }
                });
            } catch (e) {
                this._writeLog('_performAjaxCall > ' + e);
            }
        },

        _messageBox: function (p_message, p_title) {
            $("#_filterMessageBox").remove();
            $("<div/>", {
                id: '_filterMessageBox'
            }).html(p_message)
			  .dialog({
			      autoOpen: true,
			      title: p_title,
			      width: 350,
			      height: 150,
			      modal: true,
			      open: function () { },
			      close: function () { $(this).dialog('destroy'); },
			      buttons: [{
			          title: "Close",
			          text: "Close",
			          click: function () {
			              $(".ui-icon-closethick").click();
			          }
			      }]
			  });
        },

        destroy: function () {
            if (this.options.sideViewSearch) {
                $(this.options.sideViewTab).empty();
            } else {
                this.element.empty();
            }
            $.Widget.prototype.destroy.call(this);
        },

        _encodeHTML: function (p_JString) {
            return $('<div/>').text(p_JString).html();
        },

        _decodeHTML: function (p_JString) {
            return $('<div/>').html(p_JString).text();
        },

        _createMainContainer: function () {
            if (this.options.sideViewSearch) {
                if (!this.options.aggregate) { $(this.element).appendTo(this.options.sideViewTab) }
                this._$mainContainer = $('<div class="filter-main-container" data-filterId= "' + this._getDataId() + '"></div>').appendTo(this.element);
                if (this.options.sideViewSearch == "click") {
                    this.element.hide();
                } else {
                    _app.SidePanel.ChangeTitle(g_LangTranslator.Translate('Filter') + ' : ' + g_LangTranslator.Translate(g_CurrentMenuName));
                    //_app.SidePanel.DisplayPanel();
                }
            }
        },

        _createMasterControlContainer: function () {
            this._$masterControlContainer = $('<div class="filter-master-control-container"></div>').appendTo(this._$mainContainer);
        },

        _createMasterControls: function () {
            if (this.options.simpleSearch != false) {
                this._createSimpleSearchInput();
            }


            if (this.options.advancedSearch != false) {
                this._createMasterFilterSelect();
                this._bindOptions();
            }

            if (this.options.aggregate) {
                this._createAggreateSelect();
            }


            if (this.options.tableDisplay) {
                this._appendTableDisplayBlocks();
            }
        },

        _createFilterForm: function () {
            var filter = this;
            this._$filterForm = $('<form class="filter-data-form"></form>');
            this._$filterFormContainer = $('<div class="filter-form-container"></div>').keyup(function (e) {
                //var code = ;
                if (e.which == 13) {
                    e.preventDefault();
                    filter._$applyButton.click();
                }
            }).append(this._$filterForm).appendTo(this._$mainContainer);
            //For side view
            this._$filterFormContainer.css({
                'max-height': filter._getPanelMaxHeight()
            });
        },

        _getPanelMaxHeight: function (type) {
            if (this.options.sideViewPropElement) {
                if (type == 'display') {
                    return ($(this.options.sideViewPropElement).height() - 70) + "px";
                } else if (type == 'agg') {
                    return ($(this.options.sideViewPropElement).height() - 75) + "px";
                } else {
                    return ($(this.options.sideViewPropElement).height() - 45) + "px";
                }
            }

            return '450px';
        },

        _createButtonPanel: function () {
            this._$buttonPanel = $('<div class="filter-button-panel"></div>').appendTo(this._$mainContainer);

            this.options.showButtonPanelOnLoad === true ? this._$buttonPanel.show() : this._$buttonPanel.hide();
            this._appendGeneralButtons();
            if (this.options.saveSearch != false) {
                this.options.sideViewSearch ? this._appendSideViewSaveAndRemoveButtons() : this._appendSaveAndRemoveButtons();
            }

            this._hideButtons();
            this._removeButtons();

            if (this.options.commonButtonPanel === true) {
                if (this.options.aggregate) {
                    this._createAggCommonButtonPanel();
                }

                if (this.options.tableDisplay) {
                    this._disCreateDisCommonButtonPanel();
                }
            }
        },

        _appendGeneralButtons: function () {
            var _filter = this;
            this._$applyButton = $('<button id="" class="ui-widget ui-state-default ui-corner-all ui-button-text-only filter-apply-button" title="Filter Records"><span class="ui-button-text _lngTrans_Translatable">Apply</span></button>').click(function () {

                if (_filter.options.demoVersion === true) {
                    ShowValidationMessages(_filter.options.messages.permissionWarn, "Warning");
                    return false;
                }

                _filter._applyValidations();
                if (_filter._isFormValid()) {
                    if (!_filter.options.aggregate) {
                        _filter._createJsonQuery();
                    } else {
                        _filter._createAggJsonQuery();
                    }
                }
            }).appendTo(this._$buttonPanel);

            this._$clearButton = $('<button id="advClearAll" class="ui-widget ui-state-default ui-corner-all ui-button-text-only" title="Clear all filters"><span class="ui-button-text _lngTrans_Translatable">Clear All</span></button>').click(function () {
                $('.filter-agg-block-container').remove();
                //_filter._removeFieldBlock('all');
                _filter._activateFilterOption('all');
                _filter._checkBottomPanelDisplay();
                //_filter._manageAggClearAll();
                $('.filter-agg-form-container').css("display", "none");
                $('#txtTopBottomSize').attr('readonly', true);
                $('#ddlTopBottom').prop('selectedIndex', 0);
                $('#txtTopBottomSize').val('');
                if (_filter._$aggMetricsForm.children().length === 0 && _filter.options.tableDisplay != false) {
                    //_filter._$displayContainer.removeData('mode');
                    //_filter._appendTableDisplayBlocks()
                    if (_filter._$displayContainer != null) {
                        _filter._$displayContainer.removeData('mode');
                        _filter._appendTableDisplayBlocks()
                        _filter._createAggJsonQuery();
                    }
                    else {
                        _filter._createJsonQuery();
                    }
                } else if (_filter._$aggMetricsForm.children().length > 0 && _filter.options.tableDisplay != false) {
                    //_filter._disRemoveAggElementsFromDisplay($(this).val())
                    _filter._createAggJsonQuery();
                }

                if (_filter.options.customSearch) {
                    eval(_filter.options.customSearch + "()");
                } else {
                    $('.filter-control-block input:text').val('');
                    $('.filter-control-block').has('select').find('input:checkbox').removeAttr('checked');
                    $('.filter-control-block').has('select').find('select').val('');
                    $('.filter-control-block input[title="Select Multiple Items"]').trigger("change");
                }
                _filter._loadJtable();

            }).appendTo(this._$buttonPanel);
        },

        _appendSideViewSaveAndRemoveButtons: function () {
            var _filter = this;
            $('<button type="button" id="filter-side-view-split-button" class="ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" title="More"><span class="ui-button-icon-primary ui-icon ui-icon-triangle-1-s" title="More" defaultkey="More"></span></button>').click(function () {
                if (_filter._$crudSplitBtn.attr('split-active') == 'true') {
                    _filter._$crudSplitBtn.attr('split-active', 'false').hide();
                } else {
                    _filter._$crudSplitBtn.attr('split-active', 'true').show();
                }

            }).appendTo(this._$buttonPanel);

            _filter._$crudSplitBtn = $('<ul class="filter-add-remove-select-ul ui-corner-all" split-active="false"></ul>').appendTo(this._$buttonPanel).hide();

            //Append Save Filter
            $('<li><a href="#" title ="Save this query" id="filter-save-filter-btn-li _lngTrans_Translatable">Save Filter</a></li>').click(function () {
                _filter._applyValidations();
                if (_filter._isFormValid()) {
                    if (!_filter.options.aggregate) {
                        _filter._createJsonQuery(true);
                    } else {
                        _filter._createAggJsonQuery(true);
                    }
                }
            }).appendTo(_filter._$crudSplitBtn);

            //Append Remove Filter
            this._$removeButton = $('<li><a href="#" title ="Remove this query" id="filter-remove-filter-btn-li _lngTrans_Translatable">Remove Filter</a></li>').click(function () {
                _filter._removeJsonQuery();
                _filter._removeFieldBlock('all');
                _filter._activateFilterOption('all');
                _filter._checkBottomPanelDisplay();

                if (_filter.options.customSearch) {
                    eval(_filter.options.customSearch + "()");
                } else {
                    _filter._loadJtable();
                }
            }).appendTo(_filter._$crudSplitBtn).hide();
        },

        /* Save and continue feature for add record form
        *************************************************************************/
        _extCreateSplitButtonMenu: function (splitMenuItems) {
            try {
                if (splitMenuItems) {
                    var self = this;
                    var _$mainSplitContanier = self._extCreateSplitButtonMainContainer();
                    //Append split menu items
                    $.each(splitMenuItems, function (index, splitMenuItem) {
                        $('<div class="jtable-split-menu-item" />').text(splitMenuItem.title).click(function () {
                            splitMenuItem.click();
                        }).appendTo(_$mainSplitContanier);
                    })

                    //Return split button
                    return $('<button id="" style="width:18px;padding-left: 3px !important;" class="ui-widget ui-state-default ui-corner-all ui-button-text-only" title=""><span class="jtable-split-button ui-button-text _lngTrans_Translatable"></span></button>').click(function (e) {
                        if (_$mainSplitContanier.css('display') == 'none') {
                            _$mainSplitContanier.css({ top: e.pageY - 80 + 'px', left: e.pageX }).show(100);
                        } else {
                            _$mainSplitContanier.hide();
                        }
                    });
                }
            }
            catch (e) {
                this._logError('_extCreateSplitButtonMenu >' + e);
            }
        },

        _appendSaveAndRemoveButtons: function () {
            var _filter = this;
            this._$saveButton = $('<button id="" class="" title="Save this criteria"><span class="ui-button-text _lngTrans_Translatable">Save Filter</span></button>').click(function () {
                _filter._applyValidations();
                if (_filter._isFormValid()) {
                    if (!_filter.options.aggregate) {
                        _filter._createJsonQuery(true);
                    } else {
                        _filter._createAggJsonQuery(true);
                    }
                }
            }).appendTo(this._$buttonPanel);

            this._$removeButton = $('<button id="" class="" title="Remove this criteria"><span class="ui-button-text _lngTrans_Translatable">Remove Filter</span></button>').click(function () {
                _filter._removeJsonQuery();
                _filter._removeFieldBlock('all');
                _filter._activateFilterOption('all');
                _filter._checkBottomPanelDisplay();

                if (_filter.options.customSearch) {
                    eval(_filter.options.customSearch + "()");
                } else {
                    _filter._loadJtable();
                }
            }).appendTo(this._$buttonPanel).hide();
        },

        _hideButtons: function () {
            var _filter = this;
            if (this.options.hideButtons) {
                $.each(this.options.hideButtons, function (index, button) {
                    switch (button.toLowerCase()) {
                        case 'save':
                            _filter._$saveButton.hide();
                            break;
                        case 'remove':
                            _filter._$removeButton.hide();
                            break;
                        case 'apply':
                            _filter._$applyButton.hide();
                            break;
                        case 'clear':
                            _filter._$clearButton.hide();
                            break;
                    }
                })
            }
        },

        _removeButtons: function () {
            var _filter = this;
            if (this.options.removeButtons) {
                $.each(this.options.removeButtons, function (index, button) {
                    switch (button.toLowerCase()) {
                        case 'save':
                            _filter._$saveButton.remove();
                            break;
                        case 'remove':
                            _filter._$removeButton.remove();
                            break;
                        case 'apply':
                            _filter._$applyButton.remove();
                            break;
                        case 'clear':
                            _filter._$clearButton.remove();
                            break;
                    }
                });
            }
        },

        _showButtons: function () {
            var _filter = this;
            if (this.options.showButtons) {
                $.each(this.options.showButtons, function (index, button) {
                    switch (button.toLowerCase()) {
                        case 'save':
                            _filter._$saveButton.show();
                            break;
                        case 'remove':
                            _filter._$removeButton.show();
                            break;
                        case 'apply':
                            _filter._$applyButton.show();
                            break;
                        case 'clear':
                            _filter._$clearButton.show();
                            break;
                    }
                });
            }
        },

        _createSimpleSearchInput: function () {
            var l_filterTable = this._getFilterTable();
            //Remove default case sensitive nature of jquery 'Contains' function
            jQuery.expr[':'].contains = function (a, i, m) {
                return jQuery(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
            };
            var appendTo = this._$masterControlContainer;
            if (typeof this.options.simpleSearch == 'object') {
                appendTo = this.options.simpleSearch.appendTo;
            }

            this._$simpleSearchInput = $('<input class="filter-simple-search-input _lngTrans_Translatable" id="" type="text"  placeholder="Search.." />').keyup(function () {
                var keyword = $(this).val();
                var l_disp = $(l_filterTable).find('tr').hide().filter(':contains("' + keyword + '")').show();
                $(l_filterTable).find('th').parent().show();

                if (keyword.length == 0) {
                    $(l_filterTable).find('tr').show();
                }

                //Hide jatble button panel
                if (keyword.length !== 0 && l_disp.length === 0 && (l_filterTable.hasClass('jtable') || l_filterTable.data('jtable'))) {
                    if (l_filterTable.is('table')) {
                        $(l_filterTable).next().hide();
                    } else {
                        $(l_filterTable).find('.jtable-bottom-panel').hide();
                    }
                } else {
                    $(l_filterTable).next().show();

                    if (l_filterTable.is('table')) {
                        $(l_filterTable).next().show();
                    } else {
                        $(l_filterTable).find('.jtable-bottom-panel').show();
                    }
                }
            }).appendTo(appendTo);

            if (this.options.sideViewSearch) {
                this._createWrapperFilterButton(appendTo);
            }
        },

        _createWrapperFilterButton: function (appendTo) {
            try {
                this._$simpleSearchInput.hide();
                var filter = this,
                objJtable = null,
                allRows = null,
                _$wrapperHolder = $('<div class="filter-container-inner-wrapper-holder ui-corner-all" title="' + filter.options.messages.openAdFilter + '" />').appendTo(appendTo);
                filter._$simpleSearchInput.appendTo(_$wrapperHolder)
                $('<div class="filter-container-inner-wrapper" />').appendTo(_$wrapperHolder).click(function () {
                    // if (filter._$simpleSearchInput.is(':hidden')) {
                    filter._$simpleSearchInput.show(500);
                    _app.SidePanel.DisplayPanel(1);

                    objJtable = filter._getJtableInstance();
                    if (objJtable) {
                        allRows = objJtable._$tableBody.find('input:checked').closest('tr');
                        objJtable._deselectRows(allRows);
                    }

                    //Hide filter option commented
                    // } else {
                    //    filter._$simpleSearchInput.hide(500);
                    //   _app.SidePanel.hide();
                    // }
                });
            } catch (e) {
                _filter._writeLog('_createWrapperFilterButton > ' + e);
                return true;
            }
        },

        _createMasterFilterSelect: function () {
            this._$masterFilterSelect = $('<select class="filter-master-select"></select>').appendTo(this._$masterControlContainer);
        },

        _bindOptions: function () {
            if (this.options.SearchableFieldsURL) {
                this._getOptionFromURL();
            }
            this._appendMasterOptions();
        },

        _getOptionFromURL: function () {
            var _filter = this;
            try {
                this._performAjaxCall(
				this.options.SearchableFieldsURL,
				undefined,
				'json',
				false,
				function (l_data) {
				    _filter._crateFields(l_data);
				},
				function (l_data) {
				    _filter._writeLog('_getOptionFromURL > Ajax Error > ' + l_data);
				}
				);
            } catch (e) {
                _filter._writeLog('_getOptionFromURL > ' + e);
            }
        },

        _crateFields: function (p_data) {
            try {
                this.options.fields = {};
                var l_type = 'string',
				l_dbName = '',
				l_fieldName = '',
				l_options = '';

                for (var i = 0; i < p_data.Options.length; i++) {
                    if (p_data.Options[i].Value.toLowerCase().indexOf("@@@") != -1) {
                        l_type = "mselect";
                        l_options = p_data.Options[i].Value.split("@@@")[1];
                    } else
                        if (p_data.Options[i].Value.toLowerCase().indexOf("/") != -1) {
                            l_type = 'lookup';
                            l_options = p_data.Options[i].Value;
                        } else {
                            l_type = p_data.Options[i].Value.toLowerCase().replace('system.', '');
                            l_options = '';
                        }

                    l_fieldName = $.trim(p_data.Options[i].Key.split('&&')[1]);
                    l_dbName = $.trim(p_data.Options[i].Key.split('&&')[0]);
                    this.options.fields[l_dbName] = {
                        type: l_type,
                        options: l_options,
                        title: l_fieldName
                    }
                }
            }
            catch (e) {
                this._writeLog('_crateFields > ' + e);
            }
        },

        _appendMasterOptions: function () {
            var _filter = this;
            _filter._$masterFilterSelect.append('<option value="-1" class="_lngTrans_Translatable">- Add Filter -</option>');

            var fields = $.map(this.options.fields, function (item, key) {
                return { key: key, title: item.title, value: item };
            });

            fields = _app.jsonSort(fields, "title", true);
            $.each(fields, function (index, field) {
                if (field.value.category != 'hidden') {
                    _filter._$masterFilterSelect.append('<option value="' + field.key + '" class="_lngTrans_Translatable">' + $.trim(field.title) + '</option>');
                }
                _filter._fields.push(field.value.key);
            });

            /* $.each(this.options.fields, function (field, fieldOptions) {
            if (fieldOptions.category != 'hidden') {
            _filter._$masterFilterSelect.append('<option value="' + field + '" class="_lngTrans_Translatable">' + $.trim(fieldOptions.title) + '</option>');
            }
            _filter._fields.push(field);
            });*/
        },

        _generateRequiredAndHiddenFields: function () {
            var _filter = this;
            $.each(this.options.fields, function (l_fieldName, fieldOptions) {
                if (fieldOptions.category == 'required') {
                    var l_defaultData = { savedOP: fieldOptions.operator, savedValue: { value1: fieldOptions.defaultValue, value2: fieldOptions.betweenValue} }
                    _filter._createFieldBlock(l_fieldName, 'true');
                    _filter._createFieldView(l_fieldName, true, l_defaultData);
                    _filter._$buttonPanel.show();
                    _filter._disableFilterOption(l_fieldName, 'true');
                }

                if (fieldOptions.category == 'hidden') {
                    _filter._createFieldBlock(l_fieldName, 'true', true);
                    _filter._createFieldView(l_fieldName, true, { savedOP: fieldOptions.operator, savedValue: { value1: fieldOptions.defaultValue, value2: fieldOptions.betweenValue} });
                }

                if (fieldOptions.category !== 'required' && fieldOptions.displayOnLoad === true) {
                    _filter._createFieldBlock(l_fieldName);
                    _filter._createFieldView(l_fieldName, false, l_defaultData);
                    _filter._$buttonPanel.show();
                    _filter._disableFilterOption(l_fieldName, 'false');
                }
            });

            //Trigger filter with default values
            if (this.options.triggerDefault) {
                _filter._applyValidations();
                if (_filter._isFormValid()) {
                    _filter._createJsonQuery();
                }
            }
        },

        _disableFilterOption: function (p_fieldName, p_isRequired) {
            this._$masterFilterSelect.children().each(function (l_index, l_option) {
                if (l_option.value == p_fieldName) {
                    $(l_option).attr({ "disabled": "disabled", "data-required": p_isRequired });
                }
            });
        },

        _deactivateFilterOption: function () {
            if (this._$masterFilterSelect.val() != -1) {
                this._$masterFilterSelect.find(":selected").attr({ "disabled": "disabled" });
            }
        },

        _activateFilterOption: function (p_fieldName) {
            this._$masterFilterSelect.children('option:disabled').each(function (l_index, l_option) {
                if ($(l_option).attr('data-required') != 'true') {
                    if (p_fieldName == 'all') {
                        $(l_option).attr("disabled", false);
                    } else
                        if (l_option.value == p_fieldName) {
                            $(l_option).attr("disabled", false);
                            return false;
                        }
                }
            });

            this._$masterFilterSelect.get(0).selectedIndex = 0;
        },

        _activateAllFilterOption: function () {
            this._$masterFilterSelect.children('option:disabled').each(function (l_index, l_option) {
                $(l_option).attr({ "disabled": false, "data-required": "false" });
            });
            this._$masterFilterSelect.get(0).selectedIndex = 0;
        },

        _removeFieldBlock: function (p_fieldName) {
            p_fieldName == "all" ?
			this._$filterForm.find('.filter-field-block').not('[data-required = true]').not('[data-hidden = true]').remove() :
			this._$filterForm.find('[data-field = "' + p_fieldName + '"]').remove();
            this._checkBottomPanelDisplay();
        },

        _removeAllFieldBlock: function () {
            this._$filterForm.find('.filter-field-block').remove();
        },

        _checkBottomPanelDisplay: function () {
            if (this._$filterForm.find('.filter-field-block').not('[data-hidden = true]').length == 0) {
                this.options.showButtonPanelOnLoad === true ? this._$buttonPanel.show() : this._$buttonPanel.hide();
            }
        },

        _getFilterTable: function () {
            var l_Table;
            if (this.options.filterTable) {
                l_Table = $("#" + this.options.filterTable);
            } else {
                l_Table = $(this.options.bodyContainer).find('table').first();
            }
            return l_Table;
        },

        _createFieldNameBlock: function (p_fieldName, p_isRequired) {
            $('<div class="filter-field-name-main-block"></div>').appendTo(this._$fieldBlock)
			.append(this._createCheckboxBlock(p_fieldName, p_isRequired), this._createNameBlock(p_fieldName));
        },

        _createCheckboxBlock: function (p_fieldName, p_isRequired) {
            var _filter = this;
            var l_chk = $('<input class="ui-corner-all filter-field-selection-checkbox" title="Select/Deselect" id="CHK-' + p_fieldName + '" type="checkbox" checked="checked" />').change(function () {
                _filter._removeFieldBlock(p_fieldName);
                _filter._activateFilterOption(p_fieldName);
                if (_filter._$filterForm.find('.filter-field-block').not('[data-hidden = true]').length == 0) {
                    if (_filter.options.customSearch) {
                        eval(_filter.options.customSearch + "()");
                    } else {
                        _filter._loadJtable();
                    }
                } // else {
                //_filter._createJsonQuery();
                if (_filter.options.customSearch) _filter._createAggJsonQuery(false);
                else _filter._createJsonQuery();
                // }
            });

            if (p_isRequired) {
                l_chk.attr('disabled', 'disabled');
            }
            return l_chk;
        },

        _createNameBlock: function (p_fieldName) {
            return $('<span class="_lngTrans_Translatable">' + this.options.fields[p_fieldName].title + '</span>');
        },

        _createOperatorBlock: function (p_DataType, p_fieldName, p_savedOperator) {
            var _filter = this;
            var l_operatiorOptions = this.options.stringFilterOperatorOptions;
            if (!this.options.fields[p_fieldName].customOperators) {
                switch (p_DataType) {
                    case 'string':
                        l_operatiorOptions = this.options.stringFilterOperatorOptions;
                        break;

                    case 'int':
                        l_operatiorOptions = this.options.intFilterOperatorOptions;
                        break;

                    case 'date':
                        l_operatiorOptions = this.options.dateFilterOperatorOptions;
                        break;

                    case 'lookup':
                        l_operatiorOptions = this.options.lookUpFilterOperatorOptions;
                        break;

                    default:
                        l_operatiorOptions = this.options.stringFilterOperatorOptions;
                        break;
                }
            } else {
                l_operatiorOptions = this.options.fields[p_fieldName].customOperators;
            }

            var $l_select = $('<select class="ui-corner-all" id="OP-' + p_fieldName + '"></select>').change(function () {
                if ($(this).val() == "Between") {
                    _filter._createBetweenInput(p_fieldName);
                } else {
                    $("#CTRL-BW-" + p_fieldName).length > 0 ? $("#CTRL-BW-" + p_fieldName).parent().remove() : '';
                }
            })

            $.each(l_operatiorOptions, function (propName, propValue) {
                $l_select.append('<option value="' + propName + '"' + (p_savedOperator == propName ? 'selected="selected"' : '') + ' >' + propValue + '</option>');
            });

            $('<div class="filter-operator-block"></div>').append($l_select).appendTo(this._$fieldBlock);
        },

        _createStringInput: function (p_fieldName, p_savedValue) {
            var field = this.options.fields[p_fieldName],
            $input = $('<input class="ui-corner-all filter-control-text" type="text" id="CTRL-' + p_fieldName + '" ' + (p_savedValue != undefined ? 'value="' + p_savedValue + '"' : '') + '/>');
            if (field.options) {
                $input.FillAutocomplete({
                    autocompleteUrl: field.options,
                    cache: true
                }).FillAutocomplete("autocomplete")
            }
            $('<div class="filter-control-block"></div>').append($input).appendTo(this._$fieldBlock);
        },

        _createIntInput: function (p_fieldName, p_savedValue) {
            $('<div class="filter-control-block"></div>').append($('<input class="ui-corner-all filter-control-int-text" type="text" id="CTRL-' + p_fieldName + '" ' + (p_savedValue != undefined ? 'value="' + p_savedValue + '"' : '') + ' />'))
			.appendTo(this._$fieldBlock);
        },

        _createBooleanOperator: function (p_fieldName, p_savedOperator) {
            var l_operatiorOptions = this.options.booleanFilterOperatorOptions;
            var $l_select = $('<select class="ui-corner-all" id="CTRL-' + p_fieldName + '"></select>');
            $.each(l_operatiorOptions, function (propName, propValue) {
                if (p_savedOperator) {
                    $l_select.append('<option value="' + propName + '"' + (p_savedOperator == propName ? 'selected="selected"' : '') + '>' + propValue + '</option>');
                } else {
                    $l_select.append('<option value="' + propName + '"' + (propName == 1 ? 'selected="selected"' : '') + '>' + propValue + '</option>');
                }
            });
            $('<div class="filter-control-block"></div>').append($l_select).appendTo(this._$fieldBlock);
        },

        _createDateInput: function (p_fieldName, p_savedValue) {
            var l_field = this.options.fields[p_fieldName];
            var l_$datepicker = $('<input class="ui-corner-all filter-control-text" type="text" id="CTRL-' + p_fieldName + '" ' + (p_savedValue != undefined ? 'value="' + p_savedValue + '"' : '') + '/>')
			.datepicker({ dateFormat: this.options.defaultDateFormat });
            if (l_field.options) {
                l_$datepicker.datepicker(l_field.options);
            }
            $('<div class="filter-control-block"></div>').append(l_$datepicker).appendTo(this._$fieldBlock);
        },

        _createDateTimeInput: function (p_fieldName, p_savedValue) {
            var l_field = this.options.fields[p_fieldName];
            var l_$datetimepicker = $('<input class="ui-corner-all filter-control-text" type="text" id="CTRL-' + p_fieldName + '" ' + (p_savedValue != undefined ? 'value="' + p_savedValue + '"' : '') + '/>')
			.datetimepicker({
			    dateFormat: this.options.defaultDateFormat,
			    timeFormat: this.options.timePickerFormat
			});
            if (l_field.options) {
                l_$datetimepicker.datepicker(l_field.options);
            }
            $('<div class="filter-control-block"></div>').append(l_$datetimepicker).appendTo(this._$fieldBlock);
        },

        _createTimeInput: function (p_fieldName, p_savedValue) {
            var l_field = this.options.fields[p_fieldName];
            var l_$timepicker = $('<input class="ui-corner-all filter-control-text" type="text" id="CTRL-' + p_fieldName + '" ' + (p_savedValue != undefined ? 'value="' + p_savedValue + '"' : '') + '/>')
			.timepicker({
			    timeFormat: this.options.timePickerFormat
			});
            if (l_field.options) {
                l_$timepicker.datepicker(l_field.options);
            }
            $('<div class="filter-control-block"></div>').append(l_$timepicker).appendTo(this._$fieldBlock);
        },

        _createLookupInput: function (p_fieldName, p_savedValue) {
            try {
                var _filter = this,
                l_Field = _filter.options.fields[p_fieldName],
                pasteText = null,
                autoOptions = null;
                p_savedValue = p_savedValue ? p_savedValue.toString() : '';

                //Create textbox input
                var l_input = $('<input class="ui-corner-all filter-control-text filter-control-lookup-text" data-active="true" id="CTRL-' + p_fieldName + '" type="text" ' + (p_savedValue != undefined ? 'savedValue="' + p_savedValue + '"' : '') + '/>').FillAutocomplete({
                    autocompleteUrl: l_Field.options,
                    resultFromCache: l_Field.options,
                    cache: true
                }).FillAutocomplete("autocomplete")
                .on('paste', function (e) {
                    var input = $(this);
                    setTimeout(function () {
                        pasteText = $.trim(input.val()),
                        autoOptions = input.FillAutocomplete("getItems"),
                        hasItem = false;
                        $.each(autoOptions, function (id, item) {
                            if (pasteText == $.trim(item.value)) {
                                input.val(item.value);
                                input.text(item.text);
                                input.attr("text", item.text).focusout();
                                hasItem = true;
                                return false;
                            }
                        })

                        if (!hasItem) {
                            input.addClass('funcCall[FilterLookupSelectItemFromList]');
                            input.val('')
                            .text('')
                            .attr('text', '').focusout();
                        }
                    }, 100);

                }).keydown(function (e) {
                    if ($(this).val().length === 0) {
                        $(this).val('').text('').attr('text', '');
                    }
                });

                var l_input2 = $('<select id="CTRL-MULTI-' + p_fieldName + '" class="ui-corner-all filter-multiplt-select" multiple="multiple" data-active="false"></select>').hide();
                var l_valueArray = p_savedValue ? p_savedValue.split(',') : [];

                if (typeof l_Field.options == 'string') {
                    _filter._performAjaxCall(
                    l_Field.options,
                    undefined,
					'json',
                    false,
                    function (data) {
                        if (data && data.Options) {
                            $.each(data.Options, function (propName, propValue) {
                                l_input2.append('<option value="' + propValue.Value + '" ' + ($.inArray('' + propValue.Value + '', l_valueArray) != -1 ? 'selected="selected"' : '') + '>' + propValue.DisplayText + '</option>');
                            });
                        } else {
                            l_input2.attr("disabled", "disabled");
                            l_input2.attr("title", "No items found.");
                        }
                    },
                    function (error) {
                        _filter._writeLog('_createLookupInput > _performAjaxCall >' + error);
                    });
                } else {
                    if (l_Field.options.length) {
                        for (var i = 0; i < l_Field.options.length; i++) {
                            l_input2.append('<option value="' + l_Field.options[i] + '" ' + ($.inArray('' + l_Field.options[i] + '', l_valueArray) != -1 ? 'selected="selected"' : '') + '>' + l_Field.options[i] + '</option>');
                        }
                    } else {
                        $.each(l_Field.options, function (propName, propValue) {
                            l_input2.append('<option value="' + propName + '" ' + ($.inArray('' + propName + '', l_valueArray) != -1 ? 'selected="selected"' : '') + '>' + propValue + '</option>');
                        });
                    }
                }


                var l_input1 = $('<input class="ui-corner-all filter-multi-select-checkbox" title="Select Multiple Items" id="" type="checkbox" />').change(function () {
                    if ($(this).attr('checked')) {
                        l_input.attr('data-active', 'false').hide();
                        l_input2.attr('data-active', 'true').show();
                        $(this).parent().parent().css('height', '75px');
                    } else {
                        l_input.attr('data-active', 'true').show();
                        l_input2.attr('data-active', 'false').hide();
                        $(this).parent().parent().css('height', '30px');
                    }
                });

                if (p_savedValue && p_savedValue.indexOf(',') != -1) {
                    l_input.attr('data-active', 'false').hide();
                    l_input2.attr('data-active', 'true').show();
                    this._$fieldBlock.css('height', '75px');
                }

                $('<div class="filter-control-block"></div>').append(l_input, l_input2, l_input1).appendTo(this._$fieldBlock);
            } catch (e) {
                this._writeLog('_createLookupInput > ' + e);
            }
        },

        _createMultiSelectControl: function (p_fieldName, p_savedValue) {
            try {
                var _filter = this;
                var l_Field = _filter.options.fields[p_fieldName];
                var l_input = $('<select id="CTRL-' + p_fieldName + '" class="ui-corner-all filter-multiplt-select" multiple="multiple"></select>');
                var l_valueArray = p_savedValue ? p_savedValue.split(',') : [];
                _filter._performAjaxCall(
                    l_Field.options,
                    undefined,
					'json',
                    false,
                    function (data) {
                        if (data && data.Options) {
                            $.each(data.Options, function (propName, propValue) {
                                l_input.append('<option value="' + propValue.Value + '" ' + ($.inArray('' + propValue.Value + '', l_valueArray) != -1 ? 'selected="selected"' : '') + '>' + propValue.DisplayText + '</option>');
                            });
                        } else {
                            l_input.attr("disabled", "disabled");
                            l_input.attr("title", "No items found.");
                        }
                    },
                    function (error) {
                        _filter._writeLog('_createMultiSelectControl > _performAjaxCall >' + error);
                    });

                this._$fieldBlock.css('height', '75px');
                $('<div class="filter-control-block"></div>').append(l_input).appendTo(this._$fieldBlock);
            } catch (e) {
                this._writeLog('_createMultiSelectControl > ' + e);
            }
        },

        _createBetweenInput: function (p_fieldName) {
            var l_field = this.options.fields[p_fieldName];
            switch (l_field.type) {
                case 'int':
                case 'int32':
                    this._createIntBetweenInput(p_fieldName);
                    break;

                case 'date':
                case 'datetime':
                    this._createDateBetweenInput(p_fieldName);
                    break;

                case 'datewithtime':
                    this._createDateTimeBetweenInput(p_fieldName);
                    break;

                case 'time':
                    this._createTimeBetweenInput(p_fieldName);
                    break;
            }
        },

        _createIntBetweenInput: function (p_fieldName, p_savedValue) {
            $('<div class="filter-control-block"></div>').append($('<input class="ui-corner-all filter-control-int-text" type="text" id="CTRL-BW-' + p_fieldName + '" ' + (p_savedValue != undefined ? 'value="' + p_savedValue + '"' : '') + ' />'))
			.appendTo(this._$filterForm.find('[data-field="' + p_fieldName + '"]'));
        },

        _createDateBetweenInput: function (p_fieldName, p_savedValue) {
            var l_field = this.options.fields[p_fieldName];
            var l_$datepicker = $('<input class="ui-corner-all filter-control-text" type="text" id="CTRL-BW-' + p_fieldName + '" ' + (p_savedValue != undefined ? 'value="' + p_savedValue + '"' : '') + '/>')
			.datepicker({ dateFormat: this.options.defaultDateFormat });
            if (l_field.options) {
                l_$datepicker.datepicker(l_field.options);
            }
            $('<div class="filter-control-block"></div>').append(l_$datepicker).appendTo(this._$filterForm.find('[data-field="' + p_fieldName + '"]'));
        },

        _createDateTimeBetweenInput: function (p_fieldName, p_savedValue) {
            var l_field = this.options.fields[p_fieldName];
            var l_$datetimepicker = $('<input class="ui-corner-all filter-control-text" type="text" id="CTRL-BW-' + p_fieldName + '" ' + (p_savedValue != undefined ? 'value="' + p_savedValue + '"' : '') + ' />')
			.datetimepicker({
			    dateFormat: this.options.defaultDateFormat,
			    timeFormat: this.options.timePickerFormat
			});
            if (l_field.options) {
                l_$datetimepicker.datepicker(l_field.options);
            }
            $('<div class="filter-control-block"></div>').append(l_$datetimepicker).appendTo(this._$filterForm.find('[data-field="' + p_fieldName + '"]'));
        },

        _createTimeBetweenInput: function (p_fieldName, p_savedValue) {
            var l_field = this.options.fields[p_fieldName];
            var l_$timepicker = $('<input class="ui-corner-all filter-control-text" type="text" id="CTRL-BW-' + p_fieldName + '" ' + (p_savedValue != undefined ? 'value="' + p_savedValue + '"' : '') + '/>')
			.timepicker({
			    timeFormat: this.options.timePickerFormat
			});
            if (l_field.options) {
                l_$timepicker.datepicker(l_field.options);
            }
            $('<div class="filter-control-block"></div>').append(l_$timepicker).appendTo(this._$filterForm.find('[data-field="' + p_fieldName + '"]'));
        },

        /*Area for validation*/
        _applyValidations: function () {
            var _filter = this;
            var l_dataBlocks = this._$filterForm.find('.filter-field-block');
            $.each(l_dataBlocks, function (l_index, l_Block) {
                var l_FieldName = $(l_Block).attr('data-field');
                var l_Field = _filter.options.fields[l_FieldName];

                if (l_Field.category == 'required') {
                    $('#CTRL-' + l_FieldName).addClass('validate[required]');
                }

                if (l_Field.validations) {
                    $.each(l_Field.validations, function (l_aIndex, l_validation) {
                        //Apply required
                        if (l_validation.toLowerCase() == 'required') {
                            $('#CTRL-' + l_FieldName).addClass('validate[required]');
                        }
                        else
                        //Apply Range
                            if (l_validation.toLowerCase() == "range") {
                                if ($('#OP-' + l_FieldName).val() == "Between") {
                                    if (l_Field.type == 'int32' || l_Field.type == 'int') {
                                        $('#CTRL-' + l_FieldName).addClass('validate[required] funcCall[CustomIntegerRangeValidation]');
                                        $('#CTRL-BW-' + l_FieldName).addClass('validate[required]');
                                    }
                                    if (l_Field.type == 'date' || l_Field.type == 'datetime' || l_Field.type == 'datewithtime') {
                                        $('#CTRL-' + l_FieldName).addClass('funcCall[CustomDateRangeValidation]');
                                        $('#CTRL-BW-' + l_FieldName).addClass('validate[required]');
                                    }
                                }
                                else {
                                    if ($('#CTRL-' + l_FieldName).hasClass("funcCall[CustomIntegerRangeValidation]"))
                                        $('#CTRL-' + l_FieldName).removeClass('validate[required] funcCall[CustomIntegerRangeValidation]');
                                    else
                                        $('#CTRL-' + l_FieldName).removeClass('validate[required] funcCall[CustomDateRangeValidation]');
                                    $('#CTRL-BW-' + l_FieldName).removeClass('validate[required]');

                                }
                            } else {//Apply Custom
                                var l_myCustomVal = 'funcCall[' + l_validation + ']';
                                $('#CTRL-' + l_FieldName).addClass('funcCall[MyCustomValidation100]');
                            }
                    });
                } else {
                    if ($('#OP-' + l_FieldName).val() == "Between") {
                        if (l_Field.type == 'int32' || l_Field.type == 'int') {
                            $('#CTRL-' + l_FieldName).addClass('validate[required] funcCall[CustomIntegerRangeValidation]');
                            $('#CTRL-BW-' + l_FieldName).addClass('validate[required]');
                        } else {
                            $('#CTRL-' + l_FieldName).addClass('validate[required] funcCall[CustomDateRangeValidation]');
                            $('#CTRL-BW-' + l_FieldName).addClass('validate[required]');
                        }
                    }
                    else {
                        if ($('#CTRL-' + l_FieldName).hasClass("funcCall[CustomIntegerRangeValidation]"))
                            $('#CTRL-' + l_FieldName).removeClass('validate[required] funcCall[CustomIntegerRangeValidation]');
                        else
                            $('#CTRL-' + l_FieldName).removeClass('validate[required] funcCall[CustomDateRangeValidation]');
                        $('#CTRL-BW-' + l_FieldName).removeClass('validate[required]');

                    }
                }

            });
        },

        _isFormValid: function () {
            $('.filter-data-form').validationEngine({
                autoHidePrompt: true,
                promptPosition: "topLeft",
                autoHideDelay: 5000
            });

            return $('.filter-data-form').validationEngine('validate');
        },

        _arrangeSpecialFieldNames: function (fieldName) {
            return fieldName.replace(/(:|\.|\[|\]|,)/g, "\\$1");
        },

        /*Area for querybuilder*/
        /*Override on display / aggregate feature - Down*/
        _createJsonQuery: function (queryAs) {
            try {
                var _filter = this;
                var errString = [];
                var l_jsonQuery = [];
                var l_dataBlocks = this._$filterForm.find('.filter-field-block');
                var filterflag = false;
                $.each(l_dataBlocks, function (l_index, l_Block) {
                    var l_FieldName = $(l_Block).attr('data-field');
                    var l_Field = _filter.options.fields[l_FieldName];
                    var l_Type = l_Field.type;
                    var l_DisplayName = l_Field.title;
                    var l_specialCtrlName = _filter._arrangeSpecialFieldNames(l_FieldName);
                    var l_Operator = $(l_Block).find('#OP-' + l_specialCtrlName).val();
                    var l_Val1 = $.trim($(l_Block).find('#CTRL-' + l_specialCtrlName).val());
                    var l_Val2 = $.trim($(l_Block).find('#CTRL-BW-' + l_specialCtrlName).val()) || "";
                    var l_multiVal = 'false';
                    var l_lookUpName = l_Val1;
                    var l_category = l_Field.category;

                    if (l_Type == "lookup") {
                        l_multiVal = 'true';
                        var l_CTRL1 = $(l_Block).find('#CTRL-' + l_specialCtrlName);
                        var l_CTRL2 = $(l_Block).find('#CTRL-MULTI-' + l_specialCtrlName);
                        //Remove attr
                        if (l_CTRL1.val().length === 0) {
                            $(l_CTRL1).removeAttr('text savedValue').text('');
                        }

                        if (l_CTRL1.attr('data-active') == 'true') {
                            l_Val1 = l_CTRL1.text() || l_CTRL1.attr('text');
                            l_Val1 = l_Val1 ? parseInt(l_Val1) : "";
                        } else
                            if (l_CTRL2.attr('data-active') == 'true') {
                                l_Val1 = l_CTRL2.val();
                                l_Val1 = l_Val1 ? l_Val1.join() : "";
                            } else {
                                return false;
                            }
                    } else
                        if (l_Type == "mselect") {
                            l_Val1 = l_Val1.join();
                            l_multiVal = 'true';
                        }

                    if (l_Type == "boolean" || l_Type == "int16") {
                        l_Operator = "==";
                        l_Val2 = null;
                    }

                    if (l_FieldName && l_Operator && l_Val1) {
                        l_jsonQuery.push({
                            fieldName: l_FieldName,
                            operator: l_Operator,
                            value1: l_Val1,
                            value2: l_Val2,
                            displayName: l_DisplayName,
                            type: l_Type,
                            filterType: l_category,
                            lookupName: l_lookUpName,
                            multiValue: l_multiVal
                        });
                    }
                    else {
                        filterflag = true;
                        errString.push(l_FieldName);
                    }

                });

                if (_filter.options.aggregateOptions) {
                    l_jsonQuery = _filter._getFieldAggregate(l_jsonQuery);
                }
                if (filterflag) {
                    if (queryAs == 'get') {
                        ShowValidationMessages("Invalid filteration for field " + errString, "Warning");
                        l_jsonQuery = ["empty"];
                    }
                    if (queryAs == false)
                        l_jsonQuery = ["empty"];
                }
                if (l_jsonQuery.length > 0) {
                    if (queryAs == 'get') {
                        return l_jsonQuery;
                    } else if (queryAs == true) {
                        _filter._saveQuery(l_jsonQuery)
                    } else {
                        _filter._submitQuery(l_jsonQuery)
                    }
                } else {
                    _filter._trigger("cancelSubmission", null, {
                        query: []
                    });
                }
            } catch (e) {
                _filter._writeLog('_createJsonQuery > ' + e);
            }
        },

        _getFieldAggregate: function (query) {
            try {
                var ctrls = $('.filter-add-field-select'),
                values = null,
                filter = this,
                aggrArr = [];
                if (ctrls.length > 0) {
                    $.each(ctrls, function (index, ctrl) {
                        values = $(ctrl).val();
                        for (var i = 0; i < values.length; i++) {
                            hasFilter = false;
                            $.each(query, function (index1, qry) {
                                if (!qry.aggregate) {
                                    qry.aggregate = [];
                                }
                                if (qry.fieldName == values[i]) {
                                    qry.aggregate.push($(ctrl).data('fieldblock'));
                                    hasFilter = true;
                                }
                            });

                            if (!hasFilter) {
                                aggrArr = [];
                                aggrArr.push($(ctrl).data('fieldblock'));
                                query.push({
                                    fieldName: values[i],
                                    operator: "",
                                    value1: "",
                                    value2: "",
                                    displayName: filter.options.fields[values[i]].title,
                                    type: "",
                                    aggregate: aggrArr
                                });
                            }
                        }
                    })
                }
                return query;
            } catch (e) {
                this._writeLog('_getFieldAggregate > ' + e);
                return query;
            }
        },

        _saveQuery: function (p_jsonQuery) {
            try {
                var _filter = this;
                //Trigger save event
                if (_filter._trigger("savingFilterQuery", null, {
                    query: p_jsonQuery
                }) != false) {
                    var postdata = {};
                    postdata["jsonAdvancedSearchFilterCriteria"] = JSON.stringify(p_jsonQuery);
                    postdata["controllerName"] = this.options.controller;
                    postdata["actionSpecified"] = "add";
                    this._performAjaxCall(
                    _filter.options.SaveFilterCriteriaURL,
					postdata,
					'json',
                    true,
                    function (data) { //success  
                        if (data && data.Result == "OK") {
                            _filter._$removeButton.show();
                            _filter._messageBox(_filter.options.messages.saveSuccess, 'Message');
                        } else {
                            _filter._messageBox(data.Message);
                        }
                    },
                    function (e) {
                        _filter._messageBox(e);
                    });
                }

            } catch (e) {
                this._writeLog('_saveQuery > ' + e);
            }
        },

        _removeJsonQuery: function () {
            try {
                var _filter = this;
                if (_filter._trigger("removingFilterQuery", null, {
                }) != false) {
                    var postdata = {};
                    postdata["controllerName"] = this.options.controller;
                    postdata["actionSpecified"] = "delete";
                    this._performAjaxCall(
                    _filter.options.SaveFilterCriteriaURL,
					postdata,
					'json',
                    true,
                    function (data) { //success  
                        if (data && data.Result == "OK") {
                            _filter._$removeButton.hide();
                            _filter._messageBox(_filter.options.messages.deleteSuccess, 'Message');
                        } else {
                            _filter._messageBox(data.Message);
                        }
                    },
                    function (e) {
                        _filter._messageBox(e);
                    });
                }

            } catch (e) {
                this._writeLog('_saveQuery > ' + e);
            }
        },

        _submitQuery: function (p_jsonQuery) {
            try {
                var _filter = this;
                if (this._trigger("submittingQuery", null, {
                    query: p_jsonQuery
                }) != false) {
                    if (_filter.options.customSearch) {
                        p_jsonQuery = JSON.stringify(p_jsonQuery);
                        eval(_filter.options.customSearch + "(" + p_jsonQuery + ")");
                    } else {
                        _filter._loadJtable(p_jsonQuery);
                    }
                }
            } catch (e) {
                this._writeLog('_submitQuery > ' + e);
            }
        },

        _getJtableInstance: function () {
            try {
                var jtableInstance;
                if (this.options.filterTable) {
                    jtableInstance = $("#" + this.options.filterTable).find('.jtable-main-container').first().parent().data('jtable')
                } else {
                    if ($('.jtable-main-container').length > 0) {
                        jtableInstance = $('.jtable-main-container').first().parent().data('jtable');
                    }
                }
                return jtableInstance;
            } catch (e) {
                this._writeLog('_getJtableInstance > ' + e);
            }
        },

        _loadJtable: function (p_jsonQuery) {
            try {
                var l_postdata = {}, jtableInstance = this._getJtableInstance();
                if (p_jsonQuery) {
                    l_postdata["jsonAdvancedSearchFilterCriteria"] = JSON.stringify(p_jsonQuery);
                    if (this.options.filterTable) {
                        jtableInstance.load(l_postdata);
                    } else {
                        if ($('.jtable-main-container').length > 0 && p_jsonQuery) {
                            jtableInstance.load(l_postdata)
                        }
                    }
                    this._invokeReportAction(l_postdata);
                } else {
                    if (this.options.filterTable) {
                        jtableInstance.load(l_postdata);
                    } else {
                        jtableInstance.load();
                    }
                }

                //Clear all child table
                jtableInstance.clearChildren();

                //Returns the summary panel
                if (this.options.summaryPanel) {
                    this._crateSummaryTable(jtableInstance, p_jsonQuery);
                }

            } catch (e) {
                this._writeLog('_loadJtable > ' + e);
            }
        },

        /*
        * Method for generate the summary table
        */
        _crateSummaryTable: function (jtableInstance, query) {
            try {
                var _$table = $('<table class="filter-summary-table" />'),
                _$capRow = $('<tr />').append($('<th colspan="2" />').text(this.options.messages.spCap)),
                _$selRow = $('<tr />'),
                _$ftrRow = $('<tr />'),
                _$aggRow = $('<tr />'),
            jtColumns = jtableInstance._columnList,
            jtFields = [],
            jtField = null;

                //1. Append Selected Fields
                if (jtColumns) {
                    for (var i = 0; i < jtColumns.length; i++) {
                        if (jtableInstance.options.fields[jtColumns[i]].visibility != 'hidden') {
                            jtFields.push(jtableInstance.options.fields[jtColumns[i]].title);
                        }
                    }
                    _$selRow.append('<th>' + this.options.messages.selectedFields + '</th>', '<td>' + jtFields.join(', ') + '</td>');
                }

                //2. Append filter conditions summary
                var filterSummary = '',
                aggSummary = '';
                if (query) {
                    $.each(query, function (index, filter) {
                        if (filter.value1) {
                            filterSummary += '<b>Field: </b>' + filter.displayName + ', <b>Operator: </b>' + filter.operator + ', <b>Values: </b>' + filter.value1 + (filter.value2 ? ('-' + filter.value2) : '') + '<br/>';
                        }

                        if (filter.aggregate && filter.aggregate.length > 0) {
                            aggSummary += '<b>Field: </b>' + filter.displayName + ', <b>Aggregated With: </b>' + filter.aggregate.join(', ') + '<br />';
                        }
                    });
                    _$ftrRow.append('<th>' + this.options.messages.filterByFields + '</th>', '<td>' + filterSummary + '</td>');
                    _$aggRow.append('<th>' + this.options.messages.aggregatedFields + '</th>', '<td>' + aggSummary + '</td>');
                }


                //4. Append table to provided element
                $(this.options.summaryPanel).empty().append(_$table.empty().append(_$capRow, _$selRow, _$ftrRow, _$aggRow));

            } catch (e) {
                this._writeLog('_crateSummaryTable > ' + e);
            }
        },

        _invokeReportAction: function (p_postdata) {
            try {
                var _filter = this;
                $('.jtable-main-container').first().parent().find('input[name=jsonAdvancedSearchFilterCriteria]').val(p_postdata["jsonAdvancedSearchFilterCriteria"]);
                if (p_postdata["jsonAdvancedSearchFilterCriteria"] == "[]") {
                    _filter._trigger("ShowReport", null, _filter.options.FilterActionURL);
                } else {
                    var l_baseURL = location.protocol + "//" + location.hostname + (location.port && ":" + location.port) + "/";
                    $.ajax({
                        url: l_baseURL + 'json/encrypt',
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            query: p_postdata["jsonAdvancedSearchFilterCriteria"]
                        },
                        success: function (data) {
                            if (data.result == 'OK')
                                _filter._trigger("ShowReport", null, _filter.options.FilterActionURL + "?query=" + data.query);
                        },
                        error: function (e) {
                            _filter._writeLog('_invokeReportAction > Ajax > ' + e);
                        }
                    });

                }
            } catch (e) {
                this._writeLog('_invokeReportAction > ' + e);
            }
        },

        _generateSavedQuery: function () {
            try {
                var _filter = this;
                var l_savedQuery = this.options.defaultLoad;
                _filter._$buttonPanel.show();
                _filter._$removeButton.show();
                if (l_savedQuery.indexOf("@@") != -1) {
                    _filter._$removeButton.hide();
                    l_savedQuery = l_savedQuery.replace("@@", "");
                }
                l_savedQuery = JSON.parse(this._decodeHTML(l_savedQuery));
                $.each(l_savedQuery, function (l_index, l_options) {
                    var l_fieldName = l_options.fieldName;
                    var l_Field = _filter.options.fields[l_fieldName];
                    var l_SavedData = { savedOP: l_options.operator, savedValue: { value1: l_options.value1, value2: l_options.value2} };
                    if (l_Field.category == 'required') {
                        _filter._createFieldBlock(l_fieldName, 'true');
                        _filter._createFieldView(l_fieldName, true, l_SavedData);
                        _filter._disableFilterOption(l_fieldName, 'true');
                    } else
                        if (l_Field.category == 'hidden') {
                            _filter._createFieldBlock(l_fieldName, 'true', true);
                            _filter._createFieldView(l_fieldName, true, l_SavedData);
                        } else {
                            _filter._createFieldBlock(l_fieldName, 'false');
                            _filter._createFieldView(l_fieldName, false, l_SavedData);
                            _filter._disableFilterOption(l_fieldName, 'false');
                        }
                });

                this._submitQuery(l_savedQuery);

            } catch (e) {
                this._writeLog('_generateSavedQuery > ' + e);
            }
        },

        _generateSavedAggMetricsQuery: function () {
            try {
                var _filter = this;
                var l_savedQuery = this.options.defaultLoad;
                _filter._$buttonPanel.show();
                _filter._$removeButton.show();
                if (l_savedQuery.indexOf("@@") != -1) {
                    _filter._$removeButton.hide();
                    l_savedQuery = l_savedQuery.replace("@@", "");
                }
                l_savedQuery = JSON.parse(this._decodeHTML(l_savedQuery));
                var l_aggregateQueries = l_savedQuery["aggregate"] || [];

                $.each(l_aggregateQueries, function (l_index, l_aggregateQuery) {
                    if (l_aggregateQuery['operator'] == 'GROUPBY' || l_aggregateQuery['operator'] == 'INTERVAL' || l_aggregateQuery['operator'] == 'DATEINTERVAL') {
                        _filter._createAggregateDropDown(l_aggregateQuery);
                    }
                    else {
                        _filter._createMetricsDropDown(l_aggregateQuery);
                    }
                });

            } catch (e) {
                this._writeLog('_generateSavedAggMetricsQuery > ' + e);
            }
        },

        _generateSavedAggQuery: function () {
            try {
                var _filter = this;
                var l_savedQuery = this.options.defaultLoad;
                _filter._$buttonPanel.show();
                _filter._$removeButton.show();
                if (l_savedQuery.indexOf("@@") != -1) {
                    _filter._$removeButton.hide();
                    l_savedQuery = l_savedQuery.replace("@@", "");
                }
                l_savedQuery = JSON.parse(this._decodeHTML(l_savedQuery));


                var l_filterQuery = l_savedQuery["filter"] || [],
                    l_aggregateQuery = l_savedQuery["aggregate"] || [],
                    l_displayfieldsQuery = l_savedQuery["displayFields"] || [];

                if (l_filterQuery) {
                    $.each(l_filterQuery, function (l_index, l_options) {
                        var l_fieldName = l_options.fieldName;
                        var l_Field = _filter.options.fields[l_fieldName];
                        var l_SavedData = { savedOP: l_options.operator, savedValue: { value1: l_options.value1, value2: l_options.value2} };
                        if (l_Field.category == 'required') {
                            _filter._createFieldBlock(l_fieldName, 'true');
                            _filter._createFieldView(l_fieldName, true, l_SavedData);
                            _filter._disableFilterOption(l_fieldName, 'true');
                        } else
                            if (l_Field.category == 'hidden') {
                                _filter._createFieldBlock(l_fieldName, 'true', true);
                                _filter._createFieldView(l_fieldName, true, l_SavedData);
                            } else {
                                _filter._createFieldBlock(l_fieldName, 'false');
                                _filter._createFieldView(l_fieldName, false, l_SavedData);
                                _filter._disableFilterOption(l_fieldName, 'false');
                            }
                    });
                }
                if (l_aggregateQuery) {

                    var l_SavedData = [];
                    var operators = $.unique($.map(l_aggregateQuery, function (d) { return d.operator; }));
                    if ($.inArray('GROUPBY', operators) > -1) {
                        l_SavedData = $.map(l_aggregateQuery, function (d) {
                            return d.operator == 'GROUPBY' ? d.fieldName : null;
                        });
                    }

                    $.each(operators, function (l_index, l_operator) {
                        if (l_operator == 'GROUPBY') return true;
                        l_SavedData = $.map(l_aggregateQuery, function (d) {
                            return d.operator == l_operator ? d.fieldName : null;
                        });

                        var aggOption = $.map(_filter.options.aggregateDefOptions, function (value, key) {
                            return (value[l_operator]) ? { type: key, text: value[l_operator]} : null;
                        });

                        if (aggOption && aggOption.length > 0) {
                            _filter._createAggFieldBlock(l_operator);
                            _filter._createAggFieldNameBlock(l_operator, aggOption[0].text);
                            //_filter._createAggFieldsList(l_operator, aggOption[0].type, l_SavedData);
                            //_filter._disableAggFilterOption(l_operator, 'false');
                        }
                    });

                    var topBottom = $.unique($.map(l_aggregateQuery, function (d) { return { order: d.topBottomOrder, size: d.size }; }));
                    if (topBottom.length > 0) {
                        if (_filter._$aggMetricsForm.children().find('.filter-aggregation-items-selection:checked').length == 0) {
                            $('.filter-agg-form-container').css("display", "none");
                        } else {
                            $('.filter-agg-form-container').css("display", "");
                            $('#txtTopBottomSize').attr('readonly', false);
                        }
                        $('#ddlTopBottom').val(topBottom[0].order);
                        $('#txtTopBottomSize').val(topBottom[0].size);
                    }
                }
                if (l_displayfieldsQuery) {
                    _filter._appendSavedTableDisplayBlocks(l_displayfieldsQuery, l_aggregateQuery);
                }
                this._submitQuery(l_savedQuery);

            } catch (e) {
                this._writeLog('_generateSavedAggQuery > ' + e);
            }
        }
    });
})(jQuery);


/************************************************************************
* CREATE SEARCH VIEW*
*************************************************************************/
(function ($) {
    //Reference to base object members
    var base = {
        _create: $.panERP.AdvanceSearch.prototype._create
    };

    //extension members
    $.extend(true, $.panERP.AdvanceSearch.prototype, {
        options: {
        },

        _$fieldBlock: null,

        _create: function () {
            base._create.apply(this, arguments);
            this._masterSelectChangeEvent();
        },

        _masterSelectChangeEvent: function () {
            var _filter = this;
            this._$masterFilterSelect.change(function () {
                var l_fieldName = $(this).val();
                if (l_fieldName != -1) {
                    var l_Field = _filter.options.fields[l_fieldName];
                    var l_defaultData = { savedOP: l_Field.operator, savedValue: { value1: l_Field.defaultValue, value2: l_Field.betweenValue} }
                    _filter._createFieldBlock(l_fieldName);
                    _filter._createFieldView(l_fieldName, false, l_defaultData);
                    _filter._$buttonPanel.show();
                    _filter._deactivateFilterOption(l_fieldName);
                }
            });
        },

        _createFieldBlock: function (p_fieldName, p_isRequired, p_isHidden) {
            this._$fieldBlock = $('<div class="filter-field-block" data-field= "' + p_fieldName + '" data-required = ' + p_isRequired + '></div>').appendTo(this._$filterForm);
            if (p_isHidden) {
                this._$fieldBlock.attr('data-hidden', 'true').hide();
            }
        },

        _createFieldView: function (p_fieldName, p_isRequired, p_savedData) {
            try {
                var l_field = this.options.fields[p_fieldName];
                var l_savedOperator = p_savedData && p_savedData.savedOP ? $.trim(p_savedData.savedOP) : '';
                var l_savedValue = p_savedData && p_savedData.savedValue ? p_savedData.savedValue.value1 : '';
                var l_savedBEval = p_savedData && p_savedData.savedValue ? p_savedData.savedValue.value2 : '';
                this._createFieldNameBlock(p_fieldName, p_isRequired);
                var l_Between = "Between";
                switch (l_field.type.toLowerCase()) {
                    case 'string':
                        this._createOperatorBlock('string', p_fieldName, l_savedOperator);
                        this._createStringInput(p_fieldName, l_savedValue);
                        break;

                    case 'int32':
                        this._createOperatorBlock('int', p_fieldName, l_savedOperator);
                        this._createIntInput(p_fieldName, l_savedValue);
                        if (l_savedOperator == l_Between) {
                            this._createIntBetweenInput(p_fieldName, l_savedBEval);
                        }
                        break;

                    case 'boolean':
                    case 'int16':
                        this._createBooleanOperator(p_fieldName, l_savedValue);
                        break;

                    case 'date':
                    case 'datetime':
                        this._createOperatorBlock('date', p_fieldName, l_savedOperator);
                        this._createDateInput(p_fieldName, l_savedValue);
                        if (l_savedOperator == l_Between) {
                            this._createDateBetweenInput(p_fieldName, l_savedBEval);
                        }
                        break;

                    case 'datewithtime':
                        this._createOperatorBlock('date', p_fieldName, l_savedOperator);
                        this._createDateTimeInput(p_fieldName, l_savedValue);
                        if (l_savedOperator == l_Between) {
                            this._createDateTimeBetweenInput(p_fieldName, l_savedBEval);
                        }
                        break;

                    case 'time':
                        this._createOperatorBlock('date', p_fieldName, l_savedOperator);
                        this._createTimeInput(p_fieldName, l_savedValue);
                        if (l_savedOperator == l_Between) {
                            this._createTimeBetweenInput(p_fieldName, l_savedBEval);
                        }
                        break;

                    case 'lookup':
                        this._createOperatorBlock('lookup', p_fieldName, l_savedOperator);
                        this._createLookupInput(p_fieldName, l_savedValue);
                        break;

                    case 'mselect':
                        this._createOperatorBlock('lookup', p_fieldName, l_savedOperator);
                        this._createMultiSelectControl(p_fieldName, l_savedValue);
                        break;

                    default:
                        this._createOperatorBlock('string', p_fieldName, l_savedOperator);
                        this._createStringInput(p_fieldName, l_savedValue);
                        break;
                }
            }
            catch (e) {
                this._writeLog('_createFieldView > ' + e);
            }
        }
    });
})(jQuery);



/***************************************
CREATE SIDE VIEW SEARCH
***************************************/
(function ($) {
    //Reference to base object members
    var base = {
        _create: $.panERP.AdvanceSearch.prototype._create,
        _createMainContainer: $.panERP.AdvanceSearch.prototype._createMainContainer
    };

    //extension members
    $.extend(true, $.panERP.AdvanceSearch.prototype, {
        options: {
        },

        _create: function () {
            base._create.apply(this, arguments);
        },

        _createMainContainer: function () {
            if (!this.options.sideViewSearch) {
                this._$mainContainer = $('<div class="filter-main-container" data-filterId= "' + this._getDataId() + '"></div>').appendTo(this.element);
            }
            base._createMainContainer.apply(this, arguments);
        }
    });
})(jQuery);


/***************************************
CREATE PUBLIC METHODS
***************************************/
(function ($) {
    //Reference to base object members
    var base = {
        _create: $.panERP.AdvanceSearch.prototype._create
    };

    //extension members
    $.extend(true, $.panERP.AdvanceSearch.prototype, {
        options: {
        },

        _create: function () {
            base._create.apply(this, arguments);
        },

        submit: function (p_Query) {
            if (p_Query)
                if (typeof p_Query == "string") {
                    p_Query = $.parseJSON(p_Query);
                    this._submitQuery(p_Query);
                } else {
                    this._submitQuery(p_Query);
                }
        },

        load: function (p_Query) {
            if (p_Query)
                if (typeof p_Query != "string") {
                    p_Query = JSON.stringify(p_Query);
                }
            this._removeAllFieldBlock();
            this._activateAllFilterOption();
            this.options.defaultLoad = p_Query;
            this._generateSavedQuery();
            this._$removeButton.hide();
        },

        hideButtons: function (p_Buttons) {
            this.options.hideButtons = p_Buttons;
            this._hideButtons();
        },

        showButtons: function (p_Buttons) {
            this.options.showButtons = p_Buttons;
            this._showButtons();
        },

        removeButtons: function (p_Buttons) {
            this.options.removeButtons = p_Buttons;
            this._removeButtons();
        }
    });
})(jQuery);


/***************************************
CREATE Fixed Header
***************************************/
(function ($) {
    //Reference to base object members

    //extension members
    $.extend(true, $.panERP.AdvanceSearch.prototype, {
        options: {
        },
        _getFixedHeader: function (getP_ElementName) {
            _app.reCreateFixdHeader('#' + getP_ElementName);
        }
    });
})(jQuery);


/***************************************
AGGREGATE METHODS
***************************************/
(function ($) {
    //Reference to base object members
    var base = {
        _create: $.panERP.AdvanceSearch.prototype._create
    };

    //extension members
    $.extend(true, $.panERP.AdvanceSearch.prototype, {

        options: {
            messages: {
                aggBy: 'Aggregated By',
                hideAgg: 'Hide Aggregate Methods',
                filterBy: 'Filtered By'
            }
        },

        _$filterAccordion: null,
        _$aggAccordion: null,
        _filterTabs: ['Filter'],

        _create: function () {
            base._create.apply(this, arguments);
        },

        _createAggregateContainer: function () {
            if (this.options.aggregate !== false) {
                this._$masterAggContainer = $('<div class="filter-aggregate-control-container"></div>').appendTo(this._$mainContainer);
            }
        },

        _createAggreateSelect: function () {
            var filter = this,
            _$select = null,
            value = null,
            text = null,
            type = null;
            filter._$masterAggSelect = $('<div id="" class="aggHeading" ><span class="ui-button-text _lngTrans_Translatable" style="float:left;">Aggregation</span></div>').insertBefore(this._$aggTermsForm)
            filter._$masterAggSelect = $('<div id="" class="ui-widget ui-state-default ui-corner-all ui-button-text-only filter-apply-button aggAddBtn" title="Aggregation"><span class="ui-button-text _lngTrans_Translatable">Add Aggregation</span></div>').appendTo(this._$aggTermsForm)
             .click(function () {
                 if (value !== '-1') {
                     filter._createAggregateDropDown();
                 }
             });
            filter._$masterAggSelect = $('<div id="" class="metricsHeading" ><span class="ui-button-text _lngTrans_Translatable" style="float:left;">Metrics</span></div>').insertBefore(this._$aggMetricsForm)
            filter._$masterAggSelect = $('<div id="" class="ui-widget ui-state-default ui-corner-all ui-button-text-only filter-apply-button aggAddBtn" title="Metrics"><span class="ui-button-text _lngTrans_Translatable">Add Metrics</span></div>').appendTo(this._$aggMetricsForm)
             .click(function () {
                 if (value !== '-1') {
                     filter._createMetricsDropDown();
                 }
             });
            $('.aggAddBtn').parent('.filter-agg-data-form').css('padding', '5px');

        },

        _createAggregateDropDown: function (l_query) {
            $('.aggHeading').css('display', 'block');
            var filter = this,
            _$select = null,
            value = null,
            text = null,
            type = null;

            _$aggDivBLock = $('<div class="filter-agg-block-container"></div>').insertBefore(this._$aggTermsForm);
            $divClose = $('<div class="filter-aggregate-closeAgg"></div>').appendTo(_$aggDivBLock).click(function () {
                $(this).parent('.filter-agg-block-container').remove();
            });
            _$aggDiv = $('<div class="filter-aggregate-select"></div>').appendTo(_$aggDivBLock);
            $divDropDownFields = $('<div class="filter-aggregate-select drpFields"></div>').appendTo(_$aggDivBLock);
            filter._$masterAggSelect = $('<select class="filter-aggregate-select intervals"></select>').appendTo(_$aggDiv)
             .change(function () {
                 _$aggType = this;
                 _$aggDivBLock = $(this).parents('.filter-agg-block-container');
                 $divDropDownFields = $(this).parents('.filter-agg-block-container').find('.drpFields');
                 _$select = $(this);
                 value = _$select.val();
                 text = _$select.children()[this.selectedIndex].text;
                 type = $(_$select.children()[this.selectedIndex]).data('category');
                 if (value !== '-1') {
                     filter._createAggFieldBlock(value);
                     /*********************************Nithin change***********************************/
                     $(_$aggDivBLock).find('.filter-aggregate-limit,.filter-aggregate-size').remove();
                     $divDropDownLimit = $('<div class="filter-aggregate-limit topBottomOrderBlock"></div>').appendTo(_$aggDivBLock);
                     $divDropDownSize = $('<div class="filter-aggregate-size" style="  margin-left: 60%!important; margin-top: -21px;"></div>').appendTo(_$aggDivBLock);
                     $divFilterLabel = $('<div class="filter-aggregate-limit field-block"></div>').appendTo(_$aggDivBLock);
                     if (value == "terms") {
                         //                          $divDropDownLimit.append('<div style="margin-top: 10px;margin-left:3%;" class="topbottomOrder">' +
                         //	                        '<div><div style="float:left;margin-left: 2%;">Limit</div><div style="float: left;margin-left:50%;">Size</div></div>' +
                         //	                        '<select  class="filter-master-select ddlTopBottom" style="width:55%;float:left;" >' +
                         //	                        '<option class="_lngTrans_Translatable" value="all">All</option>' +
                         //	                        '<option class="_lngTrans_Translatable" value="desc">Top</option>' +
                         //	                        '<option class="_lngTrans_Translatable" value="asc">Bottom</option></select>' +
                         //	                        '<input class="txtTopBottomSize" style="width:26%;float:left;" type="text"></div>');
                         //$divDropDownLimit.append('<label>Limit</label>');
                         //$divFilterLabel.append('<div class ="filter-aggregate-select">Filter <input type="text" style="width: 91%;float:right;"></div>');
                     }
                     else {
                         $divDropDownLimit.append('<label>Interval</label>');
                         //$divFilterLabel.append('<div class ="filter-aggregate-select">From <input type="text" style="width: 91%;float:right;"></div>');
                         //$divFilterLabel.append('<div class ="filter-aggregate-select" style="padding-top: 6%;">To <input type="text" style="width: 91%;float:right;"></div>');
                     }

                     if (value == "datehistogram") {
                         $divDropDownSize.append('<select style="width: 102%" class="dateinterval-size"><option value="year">Year</option><option value="month">Month</option><option value="week">Week</option><option value="day">Day</option><option value="1h">Hours</option><option value="1m">Minute</option><option value="1s">Second</option></select>');
                         var textValue = "";
                         if (l_query != null && l_query["dateinterval"] != undefined && l_query["dateinterval"] != null) {
                             textValue = l_query["dateinterval"].toString()
                             $divDropDownSize.children('.dateinterval-size').val(textValue);
                         }

                     }
                     else {
                         if (value == "histogram") {
                             var textValue = "";
                             if (l_query != null && l_query["interval"] != undefined && l_query["interval"] != null)
                                 textValue = l_query["interval"].toString()
                             $divDropDownSize.append('<input type="text" class="interval-size" style="width: 64%" value="' + textValue + '"/>');
                         }
                     }

                     $lblDropDownOrderBY = $('<div class="filter-aggregate-limit"></div>').appendTo(_$aggDivBLock);
                     $divDropDownOrderBY = $('<div class="filter-aggregate-size top-bottomHistogram-orderBlock" style="  margin-left: 60%!important; margin-top: -21px;"></div>').appendTo(_$aggDivBLock);

                     $lblDropDownOrderBY.append('<label>Order</label>');
                     $divDropDownOrderBY.append('<select style="width: 116%" class="ddlorderby"><option value="all">None</option><option value="asc">Asc</option><option value="desc">Desc</option></select>');
                     var textValue = "";
                     if (l_query != null && l_query["topBottomOrder"] != undefined && l_query["topBottomOrder"] != null) {
                         textValue = l_query["topBottomOrder"].toString()
                         $divDropDownOrderBY.children('.ddlorderby').val(textValue);
                     }

                     /*********************************Nithin change end***********************************/

                     $divDropDownFields.empty();
                     $divFieldName = $('<div class ="filter-aggregate-select FieldName"></div>').appendTo($divFilterLabel);

                     $dropDownFields = $('<select class="filter-aggregate-select selected-agg-field" ></select>').appendTo($divDropDownFields)
                     .change(function () {
                         var _$parent = $(this).parents('.filter-agg-block-container');
                         $(_$parent).find('.field-block').children('.FieldName').empty();
                         //$divFieldName.empty();
                         var textValue = this.value;
                         if (l_query != null)
                             textValue = l_query["aliasName"].toString();
                         if (value == "histogram")
                             textValue = textValue + '-Interval';
                         else if (value == "datehistogram")
                             textValue = textValue + '-DateInterval';
                         if (this.value != "-1")
                             $(_$parent).find('.field-block').children('.FieldName').append('Display Name <input type="text" style="width: 91%;float:right;" value="' + textValue + '"/>');

                         //filter._disCreateAggregatedDisplayField($(this).val()+'_Interval', $(this).val()+'_Interval', _$aggType.value, "");
                     });
                     $dropDownFields.append('<option  value="-1" >-Fields-</option>');

                     var fields = $.map(filter.options.fields, function (item, key) {
                         return { key: key, value: item };
                     });

                     $.each(fields, function (idx, item) {
                         var fieldName = item.key, field = item.value;

                         if (_$aggType.value == 'terms')
                             $dropDownFields.append('<option  value="' + fieldName + '" >' + fieldName + '</option>');
                         else if (_$aggType.value == 'histogram') {
                             if (item.value.type == 'int' || item.value.type == 'int32' || item.value.type == 'numeric')
                                 $dropDownFields.append('<option  value="' + fieldName + '" >' + fieldName + '</option>');
                         }
                         else if (_$aggType.value == 'datehistogram') {
                             if (item.value.type == 'date')
                                 $dropDownFields.append('<option  value="' + fieldName + '" >' + fieldName + '</option>');
                         }
                     });
                     if (l_query != null) {
                         var fieldName = l_query['fieldName'].toString();
                         $dropDownFields.val(fieldName);
                         $dropDownFields.trigger('change');
                     }
                 }
             });

            filter._$masterAggSelect.append('<option  value="-1" >-Aggregation-</option>');
            filter._$masterAggSelect.append('<option  value="terms" >Terms</option>');
            filter._$masterAggSelect.append('<option  value="histogram" >Histogram</option>');
            filter._$masterAggSelect.append('<option  value="datehistogram" >Date Histogram</option>');

            if (l_query != null) {
                var l_operator = '';
                if (l_query['operator'] == 'GROUPBY')
                    l_operator = 'terms';
                if (l_query['operator'] == 'INTERVAL')
                    l_operator = 'histogram';
                if (l_query['operator'] == 'DATEINTERVAL')
                    l_operator = 'datehistogram';
                filter._$masterAggSelect.val(l_operator);
                filter._$masterAggSelect.trigger('change');
            }
        },

        _createMetricsDropDown: function (l_query) {
            $('.metricsHeading').css('display', 'block');
            var filter = this,
            _$select = null,
            value = null,
            text = null,
            type = null;


            _$aggDivBLock = $('<div class="filter-agg-block-container"></div>').insertBefore(this._$aggMetricsForm);
            $divClose = $('<div class="filter-aggregate-closeAgg"></div>').appendTo(_$aggDivBLock).click(function () {
                $(this).parent('.filter-agg-block-container').remove();
            });
            _$aggDiv = $('<div class="filter-aggregate-select"></div>').appendTo(_$aggDivBLock);
            $divDropDownFields = $('<div class="filter-aggregate-select drpFields"></div>').appendTo(_$aggDivBLock);
            filter._$masterAggSelect = $('<select class="filter-aggregate-select intervals"></select>').appendTo(_$aggDiv)
             .change(function () {
                 _$aggType = this;
                 _$aggDivBLock = $(this).parents('.filter-agg-block-container');
                 $divDropDownFields = $(this).parents('.filter-agg-block-container').find('.drpFields');
                 _$select = $(this);
                 value = _$select.val();
                 text = _$select.children()[this.selectedIndex].text;
                 type = $(_$select.children()[this.selectedIndex]).data('category');
                 if (value !== '-1') {
                     filter._createAggFieldBlock(value);
                     //filter._createAggFieldNameBlock(value, text);

                     /*********************************Nithin change***********************************/
                     $(_$aggDivBLock).find('.filter-aggregate-limit,.filter-aggregate-size').remove();
                     $divDropDownLimit = $('<div class="filter-aggregate-limit topBottomOrderBlock" ></div>').appendTo(_$aggDivBLock);
                     $divDropDownSize = $('<div class="filter-aggregate-size" style="  margin-left: 60%!important; margin-top: -21px;"></div>').appendTo(_$aggDivBLock);
                     $divFilterLabel = $('<div class="filter-aggregate-limit field-block"></div>').appendTo(_$aggDivBLock);

                     $divDropDownLimit.append('<div style="margin-top: 10px;margin-left:3%;" class="topbottomOrder">' +
	                    '<div><div style="float:left;margin-left: 2%;">Limit</div><div style="float: left;margin-left:50%;">Size</div></div>' +
	                    '<select  class="filter-master-select ddlTopBottom" style="width:55%;float:left;" >' +
	                    '<option class="_lngTrans_Translatable" value="all">All</option>' +
	                    '<option class="_lngTrans_Translatable" value="desc">Top</option>' +
	                    '<option class="_lngTrans_Translatable" value="asc">Bottom</option></select>' +
	                    '<input class="txtTopBottomSize" style="width:26%;float:left;" type="text" ></div>');
                     /*********************************Nithin change end***********************************/

                     $divDropDownFields.empty();
                     $divFieldName = $('<div class ="filter-aggregate-select FieldName"></div>').appendTo($divFilterLabel);

                     $dropDownFields = $('<select class="filter-aggregate-select selected-agg-field" ></select>').appendTo($divDropDownFields)
                     .change(function () {
                         var _$parent = $(this).parents('.filter-agg-block-container');
                         $(_$parent).find('.field-block').children('.FieldName').empty();
                         var textValue = this.value + '-' + value;
                         if (l_query != null)
                             textValue = l_query["aliasName"];
                         if (this.value != -1)
                             $(_$parent).find('.field-block').children('.FieldName').append('Display Name <input type="text" style="width: 91%;float:right;" value="' + textValue + '"/>');
                         //$divFieldName.append('Field Name <input type="text" style="width: 91%;float:right;" value="'+this.value+'"/>');
                         //filter._disCreateAggregatedDisplayField($(this).val()+'_Interval', $(this).val()+'_Interval', _$aggType.value, "");
                     });
                     $dropDownFields.append('<option  value="-1" >-Fields-</option>');

                     var fields = $.map(filter.options.fields, function (item, key) {
                         return { key: key, value: item };
                     });

                     $.each(fields, function (idx, item) {
                         var fieldName = item.key, field = item.value;

                         if (_$aggType.value == 'COUNT')
                             $dropDownFields.append('<option  value="' + fieldName + '" >' + fieldName + '</option>');
                         else {
                             if (item.value.type == 'int' || item.value.type == 'int32' || item.value.type == 'numeric')
                                 $dropDownFields.append('<option  value="' + fieldName + '" >' + fieldName + '</option>');
                         }

                     });
                     if (l_query != null) {
                         $dropDownFields.val(l_query['fieldName']);
                         $dropDownFields.trigger('change');
                     }

                 }
             });
            filter._$masterAggSelect.append('<option  value="-1" >-Metrics-</option>');
            filter._$masterAggSelect.append('<option  value="MIN" >MIN</option>');
            filter._$masterAggSelect.append('<option  value="MAX" >MAX</option>');
            filter._$masterAggSelect.append('<option  value="SUM" >SUM</option>');
            filter._$masterAggSelect.append('<option  value="AVG" >AVG</option>');
            filter._$masterAggSelect.append('<option  value="COUNT" >COUNT</option>');
            if (l_query != null) {
                filter._$masterAggSelect.val(l_query['operator']);
                filter._$masterAggSelect.trigger('change');
            }
        },


        _createAggregateForm: function () {
            var filter = this;
            this._$aggForm = $('<form class="filter-agg-data-form"></form>').appendTo(this._$masterAggContainer);
            this._$aggTermsForm = $('<div class="filter-agg-data-form"></div>').appendTo(this._$aggForm);
            this._$aggHistogramForm = $('<div class="filter-agg-data-form" ></div>').appendTo(this._$aggForm);
            this._$aggDateHistogramForm = $('<div class="filter-agg-data-form" ></div>').appendTo(this._$aggForm);
            this._$aggMetricsForm = $('<div class="filter-agg-data-form" ></div>').appendTo(this._$aggForm);
            if (this.options.aggregate) {
                this._$aggTopBottomForm = $('<div class="filter-agg-data-div"></div>');
                this._$masterTopSelect = $('<div style="margin-top: 10px;margin-left:3%;">' +
	            '<div><div style="float:left;margin-left: 2%;">Limit</div><div style="float: left;margin-left:50%;">Size</div></div>' +
	            '<select id="ddlTopBottom" class="filter-master-select" style="width:55%;float:left;" >' +
	            '<option class="_lngTrans_Translatable" value="all">All</option>' +
	            '<option class="_lngTrans_Translatable" value="desc">Top</option>' +
	            '<option class="_lngTrans_Translatable" value="asc">Bottom</option></select>' +
	            '<input id="txtTopBottomSize" style="width:26%;float:left;" type="text" readonly="readonly"></div>').appendTo(this._$aggTopBottomForm);
                this._$aggFormContainer = $('<div class="filter-agg-form-container" style="display:none;"></div>').keyup(function (e) {
                    if (e.which == 13) {
                        e.preventDefault();
                        filter._$applyButton.click();
                    }
                }).append(this._$aggTopBottomForm).appendTo(this._$aggForm);
            }
            else {
                this._$aggFormContainer = $('<div class="filter-agg-form-container"></div>').keyup(function (e) {
                    if (e.which == 13) {
                        e.preventDefault();
                        filter._$applyButton.click();
                    }
                }).append(this._$aggTopBottomForm).appendTo(this._$aggForm);
            }

            this._$aggFormContainer.css({
                'max-height': this._getPanelMaxHeight('agg')
            });
        },

        _createAggCommonButtonPanel: function () {
            this._$aggButtonPanel = this._$buttonPanel.clone(true);
            this._$aggButtonPanel.insertAfter(this._$aggForm);
        },

        _createAggFieldBlock: function (value) {
            if (value != 'terms' && value != 'histogram' && value != 'datehistogram')
                this._$aggFieldBlock = $('<div class="filter-agg-field-container" data-fieldBlock = ' + value + '></div>').appendTo(this._$aggMetricsForm);
        },

        _createAggFieldNameBlock: function (aggValue, aggName, p_isRequired) {
            //            $('<div class="filter-field-name-main-block"></div>').appendTo(this._$aggFieldBlock)
            //			.append(this._createAggCheckboxBlock(aggValue, p_isRequired), this._createAggNameBlock(aggName));
        },
        _createAggNameBlock: function (aggName) {
            return $('<span class="_lngTrans_Translatable filter-field-label">' + aggName + '</span>');
        },
        _deactivateAggFilterOption: function () {
            if (this._$masterAggSelect.val() != '-1') {
                this._$masterAggSelect.find(":selected").attr({ "disabled": "disabled" });
            }
        },

        _activateAggFilterOption: function (aggValue) {
            if (this._$masterAggSelect.val() != aggValue) {
                this._$masterAggSelect.find("[value=" + aggValue + "]").removeAttr('disabled');
            }
        },

        _manageAggClearAll: function () {
            if (this.options.aggregate) {
                this._$masterAggSelect.children().removeAttr('disabled');
                this._$masterAggSelect.find('option:eq(0)').prop('selected', true);
                this._$aggTermsForm.empty();
                this._$aggHistogramForm.empty();
                this._$aggDateHistogramForm.empty();
                this._$aggMetricsForm.empty();
                //this._$aggForm.empty();
            }

            if (this.options.tableDisplay) {
                this._$displayContainer.empty();
                this._appendTableDisplayBlocks();
            }
        },

        _createFilterAccordion: function () {
            var filter = this;
            this._$filterAccordion = $('<div id="filter-accordion-primary" class="filter-accordion-down" />').click(function () {
                filter._$masterFilterSelect.is(':hidden') ? filter._showFilter(this) : filter._hideFilter(this);
            })
            .append($('<div class="filter-accordion-agg-icon filter-accordion-down" />'), $('<span class="filter-accordion-agg-text">' + this.options.messages.filterBy + '</span>'))
            .insertBefore(this._$masterFilterSelect);

            this._$aggAccordion = $('<div id="filter-accordion-agg" class="filter-accordion-down" />').click(function () {
                filter._$masterAggSelect.is(':hidden') ? filter._showAgg(this) : filter._hideAgg(this);
            })
            .append($('<div class="filter-accordion-agg-icon filter-accordion-down" />'), $('<span class="filter-accordion-agg-text">' + this.options.messages.aggBy + '</span>'))
            .insertBefore(this._$masterAggSelect);

            this._hideFilter();
            this._hideAgg(); //Default hide

        },

        _hideAgg: function (ctrl) {
            this._$masterAggSelect.hide();
            this._$aggForm.hide();
            if (ctrl)
                $(ctrl).find('.filter-accordion-agg-icon').addClass('filter-accordion-down').removeClass('filter-accordion-up');
        },

        _showAgg: function (ctrl) {
            this._$masterAggSelect.show();
            this._$aggForm.show();
            $(ctrl).find('.filter-accordion-agg-icon').addClass('filter-accordion-up').removeClass('filter-accordion-down');
        },

        _hideFilter: function (ctrl) {
            this._$masterFilterSelect.hide();
            this._$filterFormContainer.hide();
            if (ctrl)
                $(ctrl).find('.filter-accordion-agg-icon').addClass('filter-accordion-down').removeClass('filter-accordion-up');
        },

        _showFilter: function (ctrl) {
            this._$masterFilterSelect.show();
            this._$filterFormContainer.show();
            $(ctrl).find('.filter-accordion-agg-icon').addClass('filter-accordion-up').removeClass('filter-accordion-down');
        },

        _createFilterSideViewTab: function () {
            this._getFilterTabs();
            this._createFormViewTab();
        },

        _createFormViewTab: function () {
            var _$maincontainer = $('<div class="filter-form-view-tab-holder" />'),
            _$li = $('<li />');
            _$ul = $('<ul />');
            _$panel = null,
            _$panelArr = [],
            activeTab = 0;
            for (var i = 0; i < this._filterTabs.length; i++) {
                _$panel = $('<span id="filter_' + this._filterTabs[i] + '" class="filter-form-view-side-tab-span" />');
                //if(this._filterTabs[i] != 'Aggregate')
                _$ul.append('<li><a href="#filter_' + this._filterTabs[i] + '" class="ui-widget _lngTrans_Translatable">' + this._filterTabs[i] + '</a></li>');

                if (this._filterTabs[i] == 'Filter') {
                    _$panel.html(this._$mainContainer);
                } else if (this._filterTabs[i] == 'Aggregate') {
                    _$panel.html(this._$masterAggContainer);
                } else if (this._filterTabs[i] == 'Display') {
                    _$panel.html(this._$displayMainContainer);
                }

                if (this.options.formView && this.options.formView.activeTab == this._filterTabs[i]) {
                    activeTab = i;
                }

                _$panelArr.push(_$panel);
            }
            _$maincontainer.append(_$ul).appendTo(this.options.sideViewTab);
            for (var j = 0; j < _$panelArr.length; j++) {
                _$maincontainer.append(_$panelArr[j]);
            }

            $(this.options.sideViewTab).tabs();
            if (activeTab) {
                $(this.options.sideViewTab).tabs("option", "active", activeTab);
            }
        },

        _getFilterTabs: function () {
            if (this.options.aggregate) {
                this._filterTabs.push('Aggregate');
            }

            if (this.options.tableDisplay) {
                this._filterTabs.push('Display');
            }

            if (this.options.formView && this.options.formView.tabs) {
                for (var i = 0; i < this.options.formView.tabs.length; i++) {
                    this._filterTabs.push(this.options.formView.tabs[i]);
                }
            }
            //Push items to array, if we need more tabs
        }
    });
})(jQuery);


/***************************************
DISPLAY METHODS
***************************************/
(function ($) {
    //Reference to base object members
    var base = {
        _create: $.panERP.AdvanceSearch.prototype._create,
        _createJsonQuery: $.panERP.AdvanceSearch.prototype._createJsonQuery
    };

    //extension members
    $.extend(true, $.panERP.AdvanceSearch.prototype, {

        options: {
            messages: {
            }
        },

        _createDiaplyContainer: function () {
            if (this.options.tableDisplay) {
                this._$displayMainContainer = $('<div class="filter-diaply-main-container" />').appendTo(this._$mainContainer);
                this._$displayContainer = $('<div class="filter-diaply-feature-container" />').appendTo(this._$displayMainContainer);

                //Set max height
                this._$displayContainer.css({
                    'max-height': this._getPanelMaxHeight('display')
                }).sortable({
                    containment: this._$displayContainer,
                    start: function (event, ui) {
                        $(ui.item).addClass('filter-displat-sort-active-item');
                    },
                    stop: function (event, ui) {
                        $(ui.item).removeClass('filter-displat-sort-active-item');
                    }
                });
            }
        },

        _appendTableDisplayBlocks: function () {
            var filter = this;
            //Loop all fields and append to the main container
            filter._$displayContainer.empty();
            $.each(this.options.fields, function (fieldName, field) {
                if (field.tableDisplay === false) {
                    return true;
                }

                filter._$displayContainer.append(filter._disCraeteSubContainerBlock(fieldName, field, undefined, undefined, true));
            });
        },

        _appendSavedTableDisplayBlocks: function (displayFields, aggregate) {
            var filter = this, aggrName, operator, fieldName, aliasName, fieldCount;
            filter._$displayContainer.empty();
            if (aggregate && aggregate.length > 0) {
                this._$displayContainer.data('mode', 'aggregate');
                fieldCount = aggregate.length;
            }
            $.each(displayFields, function (index, field) {

                var aggField = $.grep(aggregate, function (agg) {
                    return agg.aliasName == field.fieldName;
                });

                fieldName = field.fieldName;
                aliasName = field.fieldName;
                if (aggField.length > 0) {
                    aggrName = aggField[0].operator + "-" + aggField[0].fieldName;
                    operator = aggField[0].operator;
                    fieldName = aggField[0].fieldName;
                    aliasName = aggField[0].aliasName;
                }

                var subContainer = $('<div class="filter-display-sub-container" title="Drag to change the order." />').attr('data-aggregate', aggrName).data('operator', operator);
                subContainer.append(
                     filter._disCreateReadName(fieldName, field, operator, aliasName)
                    , filter._disCreateOrderNumber(fieldName, field, operator, field.order, fieldCount)
                    , filter._disCreateAliasName(fieldName, field, operator, field.displayName)
                    , filter._disCreateOrderBy(fieldName, field, operator, field.sort));
                filter._$displayContainer.append(subContainer);
            });
        },


        _disCraeteSubContainerBlock: function (fieldName, field, aggrName, operator, isLoad) {
            var filter = this, subContainer = $('<div class="filter-display-sub-container" title="Drag to change the order." />').attr('data-aggregate', aggrName).data('operator', operator);
            subContainer.append(
            //   filter._disCreateDisCloseBlock(fieldName, field, isLoad)
            //,  filter._disCreateDisplayName(fieldName, field)
                 filter._disCreateReadName(fieldName, field, operator)
                , filter._disCreateOrderNumber(fieldName, field, operator)
                , filter._disCreateAliasName(fieldName, field, operator)
                , filter._disCreateOrderBy(fieldName, field, operator));

            return subContainer;
        },

        _disCreateDisCommonButtonPanel: function () {
            this._$disButtonPanel = this._$buttonPanel.clone(true);
            this._$disButtonPanel.appendTo(this._$displayMainContainer);
        },

        _disCreateDisCloseBlock: function (fieldName, field, isLoad) {
            if (isLoad) { return true; }

            var $close = $('<div class="filter-display-close-icon" />').click(function () {
                $(this).closest('.filter-display-sub-container').remove();
            });
            return $('<div class="filter-display-close-block" title="Close" />').append($close);
        },

        _disCreateDisplayName: function (fieldName, field) {
            var title = field.title || fieldName;
            return $('<div class= "filter-display-fieldname-block" title="Display Name" />').text(title);
        },

        _disCreateReadName: function (fieldName, field, operator, dfValue) {
            // operator = operator ? '-' + operator : "";
            operator = (operator && operator != "GROUPBY") ? '-' + operator : "";
            dfValue = dfValue || fieldName + operator;
            return $('<div class="filter-display-subblock1" />')
             .append($('<input readonly="readonly" name="DIS-ReadName" title="Display Name" />').data('fieldName', fieldName).val(dfValue));
        },

        _disCreateOrderNumber: function (fieldName, field, operator, dfValue, maxOrder) {

            fieldName = operator ? fieldName + '-' + operator : fieldName;
            var $select = $('<select name="DIS-OrderNumber" id="ddlDIS-OrderNumber' + fieldName + '" title="Sort Order" />'), fieldsCount = fieldsCount = Object.keys(this.options.fields).length, value = null;
            $select.change(function () {
                var ddlOrderBy = '#ddlDIS-OrderBy' + fieldName;
                if ($(this).val() == 0) {
                    $(ddlOrderBy).prop('selectedIndex', 0);
                }
                else {
                    $(ddlOrderBy).prop('selectedIndex', 1);
                }
            });
            if (maxOrder == undefined && operator) {
                fieldsCount = this._$displayContainer.children().length + 1;
                if (fieldsCount > 1) {
                    this._disUpdateExistingOrderDDL(fieldsCount);
                }
            }
            fieldsCount = maxOrder || fieldsCount;

            for (var i = 0; i <= fieldsCount; i++) {
                value = i;
                if (value == 0) {
                    $select.append('<option value=0> -Select- </option>');
                }
                else {
                    $select.append('<option value=' + value + '> ' + value + ' </option>');
                }
            }
            if (dfValue) $select.val(dfValue);
            return $('<div class="filter-display-subblock2" />').append($select);
        },

        _disCreateAliasName: function (fieldName, field, operator, dfValue) {
            operator = (operator && operator != "GROUPBY") ? ' (' + operator.toLowerCase() + ')' : "";
            dfValue = dfValue || fieldName + operator;
            return $('<div class="filter-display-subblock1" />')
             .append($('<input name="DIS-AliasName" type="text" class="ui-corner-all" title="Alias Name" />').val(dfValue));
        },

        _disCreateOrderBy: function (fieldName, field, operator, dfValue) {
            fieldName = operator ? fieldName + '-' + operator : fieldName;
            var $select = $('<select name="DIS-OrderBy" id="ddlDIS-OrderBy' + fieldName + '" title="Order By" />'), value = null,
            options = ['None', 'ASC', 'DESC'];

            for (var i = 0; i < options.length; i++) {
                value = i + 1;
                $select.append('<option value=' + options[i] + '> ' + options[i] + ' </option>');
            }
            if (dfValue) $select.val(dfValue);
            return $('<div class="filter-display-subblock2" />').append($select);
        },

        _disUpdateExistingOrderDDL: function (fieldsCount) {
            $elemets = this._$displayContainer.find('[name="DIS-OrderNumber"]');
            $.each($elemets, function (index, $select) {
                $select = $($select);
                $select.empty();

                for (var i = 0; i < fieldsCount; i++) {
                    //                    value = i + 1;
                    //                    $select.append('<option value='+ value +'> '+ value + ' </option>');
                    value = i;
                    if (value == 0) {
                        $select.append('<option value=0> -Select- </option>');
                    }
                    else {
                        $select.append('<option value=' + value + '> ' + value + ' </option>');
                    }
                }
            });
        },

        _disCreateAggregatedDisplayField: function (fieldName, field, aggrName, operator) {
            if (operator != 'GROUPBY') {
                if (this._$displayContainer.data('mode') == 'aggregate') {
                    this._$displayContainer.append(this._disCraeteSubContainerBlock(fieldName, field, aggrName, operator));
                } else {
                    this._$displayContainer.data('mode', 'aggregate');
                    this._$displayContainer.empty().append(this._disCraeteSubContainerBlock(fieldName, field, aggrName, operator));
                }
            } else {
                if (this._$displayContainer.data('mode') == 'aggregate') {
                    this._$displayContainer.prepend(this._disCraeteSubContainerBlock(fieldName, field, aggrName, operator));
                } else {
                    this._$displayContainer.data('mode', 'aggregate');
                    this._$displayContainer.empty().prepend(this._disCraeteSubContainerBlock(fieldName, field, aggrName, operator));
                }
            }
        },

        _disRemoveAggregatedDisplayField: function (fieldName, field, aggrName) {
            this._$displayContainer.find('[data-aggregate="' + aggrName + '"]').remove();
            //Append all fields when aggreated removed
            if (this._$displayContainer.children().length == 0) {
                this._$displayContainer.removeData('mode');
                this._appendTableDisplayBlocks();
            }

            //Update order dropdoen list
            fieldsCount = this._$displayContainer.children().length;
            if (fieldsCount > 0) {
                this._disUpdateExistingOrderDDL(fieldsCount);
            }

        },

        _disRemoveAggElementsFromDisplay: function (operator) {
            var displayElems = this._$displayContainer.children();
            $.each(displayElems, function (index, element) {
                element = $(element);
                if ($.trim(element.data('operator')) == $.trim(operator)) {
                    element.remove();
                }
            });
        },

        /*
        */
        _createAggJsonQuery: function (queryAs) {
            var filter = this
                , query = {}
                , fieldName = null
                , aggSelected = null
                , displayItems = []
                , displayObj = {}
                , aggItems = []
                , aggObj = {}
                , aggOperator = null
                , aggName = null
                , aggBlock = null
                , sizeFlag = false
                , displayFlag = false
                , fieldFlag = false
                , intervalFlag = false;


            //Get filter object
            if (queryAs == false) {
                query['filter'] = filter._createJsonQuery(queryAs, false);
            }
            else
                query['filter'] = filter._createJsonQuery('get', false);

            //Create display field object
            if (query['filter'] == undefined || (query['filter'] != undefined && query['filter'][0] != "empty")) {
                if ($('.filter-agg-block-container').length > 0) {
                    $.each($('.filter-agg-block-container'), function (sIndex, sInput) {
                        displayObj = {};
                        displayObj['fieldName'] = $(sInput).children('.filter-aggregate-select').children('.selected-agg-field').val();
                        aggObj['operator'] = $(sInput).children('.filter-aggregate-select').children('.intervals').val().toUpperCase();
                        if (displayObj['fieldName'] == -1 || displayObj['fieldName'] == undefined)
                            fieldFlag = true;
                        else
                            displayObj['type'] = filter.options.fields[displayObj['fieldName']].type;
                        if (aggObj['operator'] == "TERMS") {
                            displayObj['fieldName'] = displayObj['fieldName'];
                            displayObj['displayName'] = $(sInput).children('.field-block').children('.FieldName').children().val();
                            displayObj['sort'] = $(sInput).children('.topBottomOrderBlock').children('.topbottomOrder').children('.ddlTopBottom').val();
                        }
                        else if (aggObj['operator'] == "HISTOGRAM") {
                            displayObj['fieldName'] = displayObj['fieldName'] + '-Interval';
                            displayObj['displayName'] = $(sInput).children('.field-block').children('.FieldName').children().val();
                            displayObj['sort'] = $(sInput).children('.top-bottomHistogram-orderBlock').children('.ddlorderby').val();
                        }
                        else if (aggObj['operator'] == "DATEHISTOGRAM") {
                            displayObj['fieldName'] = displayObj['fieldName'] + '-DateInterval';
                            displayObj['displayName'] = $(sInput).children('.field-block').children('.FieldName').children().val();
                            displayObj['sort'] = $(sInput).children('.top-bottomHistogram-orderBlock').children('.ddlorderby').val();
                        }
                        else if (aggObj['operator'] == -1) {
                            fieldFlag = true;
                        }
                        else {
                            displayObj['fieldName'] = displayObj['fieldName'] + '-' + aggObj['operator'];
                            displayObj['displayName'] = $(sInput).children('.field-block').children('.FieldName').children().val();
                            displayObj['sort'] = $(sInput).children('.topBottomOrderBlock').children('.topbottomOrder').children('.ddlTopBottom').val();
                        }
                        displayObj['order'] = 1;
                        if (displayObj['displayName'] == "") displayFlag = true;
                        displayItems.push(displayObj);
                    });
                }
                else {

                    $.each(filter._$displayContainer.children(), function (index, displayBlock) {
                        displayObj = {};
                        displayBlock = $(displayBlock);
                        displayObj['fieldName'] = displayBlock.find('[name="DIS-ReadName"]').val();
                        displayObj['type'] = filter.options.fields[displayBlock.find('[name="DIS-ReadName"]').data('fieldName')].type;
                        displayObj['displayName'] = displayBlock.find('[name="DIS-AliasName"]').val();
                        displayObj['sort'] = displayBlock.find('[name="DIS-OrderBy"]').val();
                        displayObj['order'] = displayBlock.find('[name="DIS-OrderNumber"]').val();
                        if (displayObj['displayName'] == "") displayFlag = true;
                        displayItems.push(displayObj);
                    });
                }
                if (fieldFlag)
                    ShowValidationMessages("There should not be Empty Fields in Aggregation / Metrics", "Warning");
                else if (displayFlag)
                    ShowValidationMessages("Display Name should not be empty", "Warning");
                else {
                    var displayNames = [];
                    $.each(displayItems, function (i, e) {
                        displayNames.push(e["displayName"].toLowerCase());
                    });
                    var stringLen = displayNames.length;
                    var resLen = _.uniq(displayNames).length;
                    if (stringLen != resLen) {
                        ShowValidationMessages("No duplicate display names allowed", "Warning");
                    }
                    else {
                        query['displayFields'] = displayItems;
                        GetAggregation(filter._$aggTermsForm, 0);
                        GetAggregation(filter._$aggMetricsForm, 1);
                        if (intervalFlag) {
                            query: []
                        }
                        else if (sizeFlag) {
                            ShowValidationMessages(filter.options.messages.sizeWarn, "Warning");
                            query: []
                        }
                        else {
                            query['aggregate'] = aggItems;

                            if (query) {
                                if (queryAs == 'get') {
                                    return query;
                                } else if (queryAs == true) {
                                    filter._saveQuery(query);
                                } else {
                                    filter._submitQuery(query);
                                }
                            } else {
                                filter._trigger("cancelSubmission", null, {
                                    query: []
                                });
                            }
                        }
                    }
                }
            }

            function GetAggregation(container, type) {
                $.each(container.children(), function (aggIdx, displayBlock) {
                    displayBlock = $(displayBlock);
                    aggOperator = displayBlock.data('fieldblock');
                    displayBlock = displayBlock.find('.filter-aggregation-items-cotainer');
                    aggSelected = displayBlock.find('input:checkbox:checked');

                    if (aggSelected.length > 0 && type == 1)
                        $.each(aggSelected, function (sIndex, sInput) {
                            aggObj = {};
                            aggObj['fieldName'] = $(sInput).val();
                            aggObj['type'] = filter.options.fields[aggObj['fieldName']].type;
                            aggObj['operator'] = displayBlock.closest('[data-fieldblock]').data('fieldblock');
                            if (aggObj['operator'] == "GROUPBY")
                                aggObj['aliasName'] = aggObj['fieldName'];
                            else
                                aggObj['aliasName'] = aggObj['fieldName'] + '-' + aggObj['operator'];

                            aggObj['topBottomOrder'] = $('#ddlTopBottom').val();

                            if ($('#txtTopBottomSize').val() != "") {
                                var size = $('#txtTopBottomSize').val();
                                if (parseInt(size) > 2147483647) {
                                    sizeFlag = true;
                                }
                                else
                                    aggObj['size'] = size;
                            }
                            else
                                aggObj['size'] = 0;
                            if (container.children()[0].attributes['data-fieldblock'].value == 'INTERVAL') {
                                if ($('#txtInterval' + aggObj['fieldName']).val() == "") {
                                    ShowValidationMessages('Please enter an interval for Histogram', "Warning");
                                    intervalFlag = true;
                                }
                                else
                                    aggObj['interval'] = $('#txtInterval' + aggObj['fieldName']).val();
                            }
                            if (container.children()[0].attributes['data-fieldblock'].value == 'DATEINTERVAL') {
                                if ($('#ddlDateInterval' + aggObj['fieldName']).val() == 0) {
                                    ShowValidationMessages('Please enter an interval for Histogram', "Warning");
                                    intervalFlag = true;
                                }
                                else
                                    aggObj['dateinterval'] = $('#ddlDateInterval' + aggObj['fieldName']).val();
                            }
                            aggItems.push(aggObj);
                        })

                    if ($('.filter-agg-block-container').length > 0 && type == 0) {
                        $.each($('.filter-agg-block-container'), function (sIndex, sInput) {
                            aggObj = {};
                            aggObj['fieldName'] = $(sInput).children('.filter-aggregate-select').children('.selected-agg-field').val();
                            aggObj['type'] = filter.options.fields[aggObj['fieldName']].type;
                            aggObj['operator'] = $(sInput).children('.filter-aggregate-select').children('.intervals').val().toUpperCase();
                            if (aggObj['operator'] == "TERMS") {
                                aggObj['aliasName'] = aggObj['fieldName'];
                                aggObj['operator'] = 'GROUPBY';
                                aggObj['topBottomOrder'] = $(sInput).children('.top-bottomHistogram-orderBlock').children('.ddlorderby').val();
                            }
                            else if (aggObj['operator'] == "HISTOGRAM") {
                                aggObj['aliasName'] = aggObj['fieldName'] + '-Interval';
                                aggObj['operator'] = 'INTERVAL';
                                aggObj['topBottomOrder'] = $(sInput).children('.top-bottomHistogram-orderBlock').children('.ddlorderby').val();
                            }
                            else if (aggObj['operator'] == "DATEHISTOGRAM") {
                                aggObj['aliasName'] = aggObj['fieldName'] + '-DateInterval';
                                aggObj['operator'] = 'DATEINTERVAL';
                                aggObj['topBottomOrder'] = $(sInput).children('.top-bottomHistogram-orderBlock').children('.ddlorderby').val();
                            }
                            else {
                                aggObj['aliasName'] = aggObj['fieldName'] + '-' + aggObj['operator'];
                                aggObj['topBottomOrder'] = $(sInput).children('.topBottomOrderBlock').children('.topbottomOrder').children('.ddlTopBottom').val();
                            }
                            if ($(sInput).children('.topBottomOrderBlock').children('.topbottomOrder').children('.txtTopBottomSize').val() != "") {
                                var size = 0
                                if ($('.txtTopBottomSize') != undefined && $('.txtTopBottomSize').val() != "") {
                                    size = $('.txtTopBottomSize').val();
                                    if (parseInt(size) > 2147483647) {
                                        sizeFlag = true;
                                    }
                                    else
                                        aggObj['size'] = size;
                                }
                                else {
                                    aggObj['size'] = size;
                                }

                            }
                            else
                                aggObj['size'] = 0;

                            if (aggObj['operator'] == 'INTERVAL') {
                                if ($(sInput).children('.filter-aggregate-size').children('.interval-size').val() == "") {
                                    ShowValidationMessages('Please enter an interval for Histogram', "Warning");
                                    intervalFlag = true;
                                }
                                else if (parseInt($(sInput).children('.filter-aggregate-size').children('.interval-size').val()) > 2147483647) {
                                    sizeFlag = true;
                                }
                                else
                                    aggObj['interval'] = $(sInput).children('.filter-aggregate-size').children('.interval-size').val();
                            }
                            if (aggObj['operator'] == 'DATEINTERVAL') {
                                if ($(sInput).children('.filter-aggregate-size').children('.dateinterval-size').val() == 0) {
                                    ShowValidationMessages('Please enter an interval for Histogram', "Warning");
                                    intervalFlag = true;
                                }
                                else
                                    aggObj['dateinterval'] = $(sInput).children('.filter-aggregate-size').children('.dateinterval-size').val();
                            }
                            aggItems.push(aggObj);

                        })
                    }
                });
            }
        }
    });
})(jQuery);

function CustomIntegerRangeValidation(field, rules, i, options) {
    var l_FromId = "#" + $(field).attr('id');
    var l_ToId = "#" + $(field).attr('id').replace("CTRL-", "CTRL-BW-");
    var l_val1 = $(l_ToId).val();
    l_val1 = l_val1 ? parseInt(l_val1) : 0;
    var l_val2 = $(l_FromId).val();
    l_val2 = l_val2 ? parseInt(l_val2) : 0;
    if (l_val1 < l_val2) {
        return "Invalid range.";
    }
}


function CustomDateRangeValidation(field, rules, i, options) {
    var l_FromId = "#" + $(field).attr('id');
    var l_ToId = "#" + $(field).attr('id').replace("CTRL-", "CTRL-BW-");
    var l_val1 = $(l_ToId).val();
    l_val1 = $.datepicker.parseDate(_app.dateTimeFormat, l_val1);
    var l_val2 = $(l_FromId).val();
    l_val2 = $.datepicker.parseDate(_app.dateTimeFormat, l_val2);
    if (l_val1 < l_val2) {
        return "Invalid Date range.";
    }
}

function FilterLookupSelectItemFromList(field, rules, i, options) {
    var input = "#" + $(field).attr('id');
    if (!$(input).text()) {
        return "Select item from the list.";
    }
}