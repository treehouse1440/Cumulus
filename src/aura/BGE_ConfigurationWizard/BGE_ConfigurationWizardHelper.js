({
    /********************************************* View Modules *********************************************/
    
    /**
     * @description Returns the Template Info View module.
     * @param component. Lightning Component reference.
     * @param model. The Model.
     * @return View of the Template Info module.
     */
    TemplateInfoView : function(component, model) {
        return (function (component, model) {

            // Subscribe to the model onInfoUpdated event.
            model.getTemplateInfo().onInfoUpdated.subscribe(function() {
                var templateInfoView = component.get('v.templateInfo');
                var templateInfo = model.getTemplateInfo();
                templateInfoView.name = templateInfo.name;
                templateInfoView.id = templateInfo.id;
                templateInfoView.description = templateInfo.description;
                templateInfoView.requireTotalMatch = templateInfo.requireTotalMatch;
                templateInfoView.expectedCount = templateInfo.expectedCount;
                templateInfoView.expectedTotal = templateInfo.expectedTotal;

                component.set('v.templateInfo', templateInfoView);
            });

            // TemplateInfoView module public functions and properties
            return {
                name: '',
                id: '',
                description: '',
                requireTotalMatch: false,
                expectedCount: 0,
                expectedTotal: 0
            };
        })(component, model);
    },

    /**
     * @description Returns the Template Metadata View module.
     * @param component. Lightning Component reference.
     * @param model. The Model.
     * @return View of the Template Metadata module.
     */
    TemplateMetadataView : function(component, model) {
        return (function (component, model) {

            // Subscribe to the model onMetadataUpdated event.
            model.getTemplateMetadata().onMetadataUpdated.subscribe(function() {
                var templateMetadataView = component.get('v.templateMetadata');
                var templateMetadata = model.getTemplateMetadata();
                var headerChanged = Boolean(templateMetadataView.pageHeader !== templateMetadata.pageHeader);

                templateMetadataView.labels = templateMetadata.labels;
                templateMetadataView.mode = templateMetadata.mode;
                templateMetadataView.hasError = templateMetadata.hasError;
                templateMetadataView.errorMessage = templateMetadata.errorMessage;
                templateMetadataView.dataTableChanged = templateMetadata.dataTableChanged;
                templateMetadataView.pageHeader = templateMetadata.pageHeader;

                if (!templateMetadataView.hasError) {
                    templateMetadataView.progressIndicatorStep = templateMetadata.progressIndicatorStep;
                    _sendMessage('setStep',templateMetadata.progressIndicatorStep);
                } else {
                    component.find('notifLib').showNotice({
                        'variant': 'error',
                        'header': $A.get('$Label.c.PageMessagesError'),
                        'message': templateMetadataView.errorMessage,
                        closeCallback: function() {
                            //callback action here
                        }
                    });
                }

                if (templateMetadataView.mode === 'view') {
                    component.set('v.isReadOnly', true);
                } else if (templateMetadataView.mode === 'create' || templateMetadataView.mode === 'edit') {
                    component.set('v.isReadOnly', false);
                    if (templateMetadata.mode === 'edit') {
                        templateMetadata.labels.batchTemplateHeader = $A.get('$Label.c.bgeBatchTemplateEdit')
                    } else if (templateMetadata.mode === 'create') {
                        templateMetadata.labels.batchTemplateHeader = $A.get('$Label.c.bgeBatchTemplateNew');
                    }
                }

                //update page header in modal if page header has changed and modal is used
                if (headerChanged) {
                    _sendMessage('setHeader', templateMetadataView.pageHeader);
                }

                // when in modal context, need to notify the modal footer component
                _sendMessage('dataTableChanged', templateMetadataView.dataTableChanged);
                _sendMessage('setError', templateMetadataView.hasError);

                component.set('v.templateMetadata', templateMetadataView);
            });

            function _sendMessage(channel, message) {
                var sendMessage = $A.get('e.ltng:sendMessage');
                sendMessage.setParams({
                    'channel': channel,
                    'message': message
                });
                sendMessage.fire();
            }

            // TemplateMetadataView module public functions and properties
            return {
                labels: {},
                mode: '',
                progressIndicatorStep: '',
                hasError: false,
                errorMessage: '',
                dataTableChanged: false
            };
        })(component, model);
    },

    /**
     * @description Returns the Template Fields View module.
     * @param component. Lightning Component reference.
     * @param model. The Template Fields Model.
     * @return View of the Template Fields module.
     */
    TemplateFieldsView : function(component, model) {
        return (function (component, model) {

            // Subscribe to the model onFieldsUpdated event.
            model.getTemplateFields().onFieldsUpdated.subscribe(function() {
                var templateFields = component.get('v.templateFields');
                templateFields.fieldGroups = [];

                var activeFieldsBySObject = model.getTemplateFields().getActivesBySObject();
                var allFieldsBySObject = model.getTemplateFields().getAllFieldsBySObject();

                Object.keys(allFieldsBySObject).forEach(function(sObjectName) {
                    var currentFieldGroup = {
                        sObjectName : sObjectName,
                        options: [],
                        values: []
                    };

                    allFieldsBySObject[sObjectName].forEach(function(currentField) {
                        currentFieldGroup.options.push(
                            {
                                label: currentField.label,
                                value: currentField.id
                            }
                        );
                    });
                    if (activeFieldsBySObject[sObjectName]) {
                        activeFieldsBySObject[sObjectName].forEach(function(currentField) {
                            currentFieldGroup.values.push(currentField.id);
                        });
                    }
                    templateFields.fieldGroups.push(currentFieldGroup);
                });

                component.set('v.templateFields', templateFields);
            });

            // TemplateFieldsView module public functions and properties
            return {
                fieldGroups: []
            };
        })(component, model);
    },

    /**
     * @description Returns the Template Field Options View module.
     * @param component. Lightning Component reference.
     * @param model. The Template Fields Model.
     * @return View of the Template Field Options module.
     */
    TemplateFieldOptionsView : function(component, model) {
        return (function (component, model) {

            var isReadOnly = component.get('v.isReadOnly');
            var _columns = _getColumns(!isReadOnly);

            // Subscribe to the model onMetadataChange event.
            model.getTemplateMetadata().onMetadataUpdated.subscribe(function() {
                var templateFieldOptions = component.get('v.templateFieldOptions');
                var isReadOnly = component.get('v.isReadOnly');
                templateFieldOptions.columns = _getColumns(!isReadOnly);
                component.set('v.templateFieldOptions', templateFieldOptions);
            });

            // Subscribe to the model onFieldsUpdated event.
            model.getTemplateFields().onFieldsUpdated.subscribe(function() {
                var templateFieldOptions = component.get('v.templateFieldOptions');
                templateFieldOptions.data = [];
                var activeFields = model.getTemplateFields().getActives();
                var templateFields = model.getTemplateFields();
                templateFieldOptions.errors = templateFields.errors;

                activeFields.forEach(function (currentField) {

                    templateFieldOptions.data.push({
                        name: currentField.name,
                        sObjectName: currentField.sObjectName,
                        label: currentField.label,
                        defaultValue: currentField.defaultValue,
                        required: currentField.required,
                        hide: currentField.hide
                    });

                });
                component.set('v.templateFieldOptions', templateFieldOptions);

            });

            /**
             * @description Gets the columns definition.
             * @param isEditable. The TemplateMetadata mode.
             * @return List of columns.
             */
            function _getColumns(isEditable) {
                return [
                    {
                        type: 'text',
                        fieldName: 'sObjectName',
                        label: $A.get('$Label.c.stgLabelObject'),
                        editable: false
                    },
                    {
                        type: 'text',
                        fieldName: 'label',
                        label: $A.get('$Label.c.stgLabelField'),
                        editable: false
                    },
                    {
                        type: 'text',
                        fieldName: 'defaultValue',
                        label: $A.get('$Label.c.stgDefaultValue'),
                        editable: isEditable
                    },
                    {
                        type: 'boolean',
                        fieldName: 'required',
                        label: $A.get('$Label.c.lblRequired'),
                        editable: isEditable
                    },
                    {
                        type: 'boolean',
                        fieldName: 'hide',
                        label: $A.get('$Label.c.stgLabelHidden'),
                        editable: isEditable
                    }
                ];
            }

            // TemplateFieldOptionsView module public functions and properties
            return {
                columns: _columns,
                data: []
            };

        })(component, model);
    },


    /*********************************************** Model Modules *********************************************/

    /**
     * @description Gets the Model module of Template Details.
     * This is the main and only Model module for the Template 
     * Details components. Contains references to TemplateFields
     * and TemplateInfo sub-modules.
     * @return Model module of Template Details.
     */
    TemplateDetailsModel : function() {
        return (function (templateFields, templateInfo, templateMetadata) {
            var _templateFields = templateFields;
            var _templateInfo = templateInfo;
            var _templateMetadata = templateMetadata;
            var _bgeTemplateController;
            
            /* **********************************************************
             * @Description Gets the Template Details and loads sub-modules.
             * @param component. Lightning Component reference.
             * @return void.
             ************************************************************/
            function init(component) {
                var recordId = _templateInfo.id ? _templateInfo.id : component.get('v.recordId');
                var sObjectName = component.get('v.sObjectName');
                _bgeTemplateController.getRecordDetails(sObjectName, recordId, {
                    success: function(response) {
                        _templateInfo.load(
                            {
                                name: response.name,
                                id: response.id,
                                description: response.description,
                                requireTotalMatch: response.requireTotalMatch,
                                expectedCount: response.expectedCount,
                                expectedTotal: response.expectedTotal
                            }
                        );

                        _templateFields.load(response.templateFields, JSON.parse(response.activeFields));
                        _templateMetadata.load(response.labels, component);
                    },
                    error: function(error) {
                        console.log(error);
                    }
                });
            }

            /**
             * @description Saves the model information to the backend.
             * @return void.
             */
            function save() {
                var templateDetailsData = {
                    name: _templateInfo.name,
                    id: _templateInfo.id,
                    description: _templateInfo.description,
                    requireTotalMatch: _templateInfo.requireTotalMatch,
                    expectedCount: _templateInfo.expectedCount,
                    expectedTotal: _templateInfo.expectedTotal
                };
                var activeFields = [];

                _templateFields.getActives().forEach(function(currentField) {
                    activeFields.push({
                        label: currentField.label,
                        name: currentField.name,
                        sObjectName: currentField.sObjectName,
                        defaultValue: currentField.defaultValue,
                        required: currentField.required,
                        hide: currentField.hide,
                        sortOrder: currentField.sortOrder
                    });
                });

                var sObjectName = _templateMetadata.labels.sObjectNameNoNamespace;

                _bgeTemplateController.saveRecord(sObjectName, templateDetailsData, activeFields, {
                    success: function(response) {
                        _templateInfo.load(
                            {
                                name: response.name,
                                id: response.id,
                                description: response.description,
                                requireTotalMatch: response.requireTotalMatch,
                                expectedCount: response.expectedCount,
                                expectedTotal: response.expectedTotal
                            }
                        );
                        _templateMetadata.reload(response.id);
                    },
                    error: function(error) {
                        console.log(error);
                    }
                });
            }

            /**
             * @description Sets the Apex backend controller module.
             * @return void.
             */
            function setBackendController(bgeTemplateController) {
                _bgeTemplateController = bgeTemplateController
            }

            /**
             * @description Gets the Template Fields module.
             * @return Template Fields module.
             */
            function getTemplateFields() {
                return _templateFields;
            }

            /**
             * @description Gets the Template Info module.
             * @return Template Info module.
             */
            function getTemplateInfo() {
                return _templateInfo;
            }

            /**
             * @description Gets the Template Metadata module.
             * @return Template Metadata module.
             */
            function getTemplateMetadata() {
                return _templateMetadata;
            }

            // TemplateDetailsModel module public functions and properties
            return {
                init: init,
                save: save,
                setBackendController: setBackendController,
                getTemplateFields: getTemplateFields,
                getTemplateInfo: getTemplateInfo,
                getTemplateMetadata: getTemplateMetadata
            }
        })(this.TemplateFields(), this.TemplateInfo(), this.TemplateMetadata());
    },

    /**
     * @description Gets the Model module of the Template Info.
     * @return Model module of the Template Info.
     */
    TemplateInfo : function() {
        return (function (Event) {
            var _onInfoUpdated = new Event(this);
            
            /**
             * @description Loads the Info, and notify all the
             * _onInfoUpdated listeners.
             * @return List of fields.
             */
            function load(info) {
                this.name = info.name;
                this.description = info.description;
                this.id = info.id;
                this.requireTotalMatch = info.requireTotalMatch;
                this.expectedCount = info.expectedCount;
                this.expectedTotal = info.expectedTotal;
                this.onInfoUpdated.notify();
            }

            /**
             * @description Validates the required templateInfo.
             * @return Boolean validity.
             */
            function isValid() {
                return this.name && this.description
            }
            
            // TemplateInfo module public functions and properties
            return {
                name: '',
                id: '',
                description: '',
                requireTotalMatch: false,
                expectedCount: 0,
                expectedTotal: 0,
                load: load,
                isValid: isValid,
                onInfoUpdated: _onInfoUpdated
            }
        })(this.Event());
    },

    /**
     * @description Gets the Template Fields module.
     * @return Model module of the Template Fields.
     */
    TemplateFields : function() {
        return (function (Event) {
            var _allFields = [];
            var _onFieldsUpdated = new Event(this);

            /* ******************PUBLIC FUNCTIONS*************************/

            /**
             * @description Load the fields and notify onFieldsUpdated listeners.
             * @param allFields: list of allFields with sObjectName/Name.
             * param activeFields: Map of activeFieldsBySObject with sObjectName, Name,
             * and Default Value, Hide and Required flags.
             * @return void.
             */
            function load(allFields, activeFields) {
                _allFields = [];
                var activeFieldMap = new Map();

                if (activeFields) {
                    activeFields.forEach(function(activeField) {
                        var fieldId = activeField.sObjectName + '.' + activeField.name;
                        activeFieldMap.set(fieldId, activeField);
                    });
                }

                var availableSortOrder = 1;
                allFields.forEach(function(currentField) {
                    currentField.id = currentField.sObjectName + '.' + currentField.name;
                    //set Active fields with saved sort order
                    if (activeFieldMap.has(currentField.id)) {
                        currentField.isActive = true;
                        currentField.defaultValue = activeFieldMap.get(currentField.id).defaultValue;
                        currentField.hide = activeFieldMap.get(currentField.id).hide;
                        currentField.required = activeFieldMap.get(currentField.id).required;
                        currentField.sortOrder = activeFieldMap.get(currentField.id).sortOrder;
                    } else {
                        currentField.isActive = false;
                    }
                    currentField.availableSortOrder = availableSortOrder;
                    availableSortOrder++;
                    _allFields.push(currentField);
                });
                this.onFieldsUpdated.notify();
            }

            /**
            * @description Gets all fields grouped by SObject.
            * @return Map of SObject group to List of all fields.
            */
            function getAllFieldsBySObject() {
                return _groupFieldsBySObject(_allFields);
            }

            /**
             * @description Gets the available fields grouped by SObject.
             * @return Map of SObject group to List of inactive fields.
             */
            function getAvailablesBySObject() {
                var availableFields = [];
                _allFields.forEach(function(currentField) {
                    if (!currentField.isActive) {
                        availableFields.push(currentField);
                    }
                });
                return _groupFieldsBySObject(availableFields);
            }

            /**
             * @description Gets the active fields.
             * @return Sorted List of related active fields.
             */
            function getActives() {
                var activeFields = [];
                _allFields.forEach(function(currentField) {
                    if (currentField.isActive) {
                        activeFields.push(currentField);
                    }
                });
                return _sortFieldsByOrder(activeFields);
            }

            /**
             * @description Gets the active fields grouped by SObject.
             * @return Map of SObject group to List of related active fields.
             */
            function getActivesBySObject() {
                var activeFields = [];
                _allFields.forEach(function(currentField) {
                    if (currentField.isActive) {
                        activeFields.push(currentField);
                    }
                });
                activeFields = _sortFieldsByOrder(activeFields);
                return _groupFieldsBySObject(activeFields);
            }

            /**
             * @description Validates the required templateInfo.
             * @return Boolean validity.
             */
            function getRequiredFieldErrors() {
                var errors = [];
                var activeFieldsBySObject = getActivesBySObject();
                var systemRequiredFieldsBySObject = _getSystemRequiredFieldsBySObject();

                Object.keys(systemRequiredFieldsBySObject).forEach(function(currentSObject) {
                    var activeFieldNames = [];
                    var systemRequiredFieldNames = new Map();

                    //only check validity if sObject is included in activeFieldsBySObject
                    if (activeFieldsBySObject[currentSObject]) {
                        activeFieldsBySObject[currentSObject].forEach(function(currentField) {
                            activeFieldNames.push(currentField.name);
                        });
                        systemRequiredFieldsBySObject[currentSObject].forEach(function(currentField) {
                            systemRequiredFieldNames.set(currentField.name, currentField.label);
                        });

                        var containsSystemRequiredField = Array.from(systemRequiredFieldNames.keys()).every(function(currentFieldName) {
                            return activeFieldNames.indexOf(currentFieldName) > -1;
                        });
                        if (!containsSystemRequiredField) {
                            errors.push(currentSObject + ' (' + Array.from(systemRequiredFieldNames.values()).join(', ') + ')');
                        }
                    }
                });

                return errors.length > 0 ? $A.get('$Label.c.bgeBatchTemplateErrorRequiredFields') + ' ' + errors.join(', ') + '.' : '';
            }

            /**
             * @description Updates isActive flag and sort Order of all fields
             * @return void.
             */
            function updateToActive(templateFieldGroups) {
                var fieldCountPreviousObjects = 0;
                var allFieldsBySObject = getAllFieldsBySObject();
                Object.keys(allFieldsBySObject).forEach(function(currentSObject) {
                    templateFieldGroups.forEach(function(currentFieldGroup) {
                        if (currentFieldGroup.sObjectName === currentSObject) {
                            allFieldsBySObject[currentSObject].forEach(function (currentField) {
                                currentField.isActive = currentFieldGroup.values.includes(currentField.id);
                                // the field's sort order is its index PLUS the total of all active fields from all previous object groups
                                currentField.sortOrder = currentField.isActive ? currentFieldGroup.values.indexOf(currentField.id) + fieldCountPreviousObjects : null;
                            });
                            // increase the buffer by the number of active fields from this object
                            fieldCountPreviousObjects += currentFieldGroup.values.length;
                        }
                    });
                });

                this.onFieldsUpdated.notify();
            }

            /**
             * @description Updates the selected fields to Active, unselects fields
             * @return void.
             */
            function updateTemplateFieldOptions(templateFieldOptions) {

                var allValid = true;
                var errors = { rows: {}, table: {}, size: 0 };

                _allFields.forEach(function(currentField) {
                    templateFieldOptions.forEach(function(currentActiveField) {
                        if (currentField.name === currentActiveField.name) {
                            currentField.required = currentActiveField.hasOwnProperty('required') ? currentActiveField.required : currentField.required;
                            currentField.hide = currentActiveField.hasOwnProperty('hide') ? currentActiveField.hide : currentField.hide;
                            currentField.defaultValue = currentActiveField.hasOwnProperty('defaultValue') ? currentActiveField.defaultValue : currentField.defaultValue;
                        }
                    });

                    if (currentField.hide && !currentField.defaultValue) {

                        allValid = false;
                        var fieldName = currentField.name;
                        var fieldNameGroup = {
                            title: $A.get('$Label.c.PageMessagesError'),
                            messages: [$A.get('$Label.c.bgeBatchTemplateErrorDefaultValue')],
                            fieldNames: ['defaultValue']
                        };
                        errors.rows[fieldName] = fieldNameGroup;
                        errors.size += 1;
                    }
                });

                if (!allValid) {
                    errors.table = {
                        title: $A.get('$Label.c.PageMessagesError'),
                        messages: [$A.get('$Label.c.bgeBatchTemplateErrorDefaultValue')]
                        };
                } else {
                    errors = { rows: [], table: [], size: 0 };
                }

                this.errors = errors;
                this.onFieldsUpdated.notify();
            }

            /* ******************PRIVATE FUNCTIONS************************/

            /**
             * @description Gets the system required fields grouped by SObject.
             * @return Map of SObject group to List of system required fields.
             */
            function _getSystemRequiredFieldsBySObject() {
                var systemRequiredFields = [];
                _allFields.forEach(function(currentField) {
                    if (currentField.systemRequired) {
                        systemRequiredFields.push(currentField);
                    }
                });
                return _groupFieldsBySObject(systemRequiredFields);
            }

            /**
             * @description Groups the fields by SObject name.
             * @param fields: list of fields.
             * @return Map of SObject name to List of related fields.
             */
            function _groupFieldsBySObject(fields) {
                var result = {};
                fields.forEach(function(currentField) {
                    if ((currentField.sObjectName in result) === false) {
                        result[currentField.sObjectName] = [];
                    }
                    result[currentField.sObjectName].push(currentField);
                });

                return result;

            }

            /**
             * @description Sort the fields by order.
             * @param fields. List of the fields to sort.
             * @return sorted fields.
             */
            function _sortFieldsByOrder(fields) {
                fields.sort(function(currentField, nextField) {
                    if (currentField.sortOrder < nextField.sortOrder) {
                        return -1;
                    }
                    if (currentField.sortOrder > nextField.sortOrder) {
                        return 1;
                    }
                    // numbers must be equal
                    return 0;
                });
                return fields;
            }

            // TemplateFieldsModel module public functions and properties
            return {
                errors: {},
                load: load,
                getRequiredFieldErrors: getRequiredFieldErrors,
                getAllFieldsBySObject: getAllFieldsBySObject,
                getAvailablesBySObject: getAvailablesBySObject,
                getActives: getActives,
                getActivesBySObject: getActivesBySObject,
                updateToActive: updateToActive,
                updateTemplateFieldOptions: updateTemplateFieldOptions,
                onFieldsUpdated: _onFieldsUpdated

            }
        })(this.Event());
	},

    /**
     * @description Gets the Model module of the Template Metadata,
     * such as page mode and labels.
     * @return Model module of the Template Metadata.
     */
    TemplateMetadata : function() {
        return (function (Event) {
            var _onMetadataUpdated = new Event(this);

            /* **********************************************************
             * @Description Loads the Info, and notify all the
             *      _onMetadataUpdated listeners.
             * @return void.
             ************************************************************/
            function load(labels, component) {
                this.labels = labels;
                //isReadOnly (View) is passed from record home with lightning app builder
                if (component.get('v.isReadOnly')) {
                    this.setMode('view');
                } else {
                    if (component.get('v.recordId') !== null) {
                        this.setMode('edit');
                    } else {
                        this.setMode('create');
                    }
                }
                this.setPageHeader();
                this.onMetadataUpdated.notify();
            }

            /**
             * @description Navigates to the record's sObject Home
             * @param recordId - the record we want to view
             */
            function reload(recordId) {
                var navEvt = $A.get('e.force:navigateToSObject');
                navEvt.setParams({
                    'recordId': recordId
                });
                navEvt.fire();
            }

            /**
             * @description Increments Wizard to next step if no errors exist
             * @param isValid - string that is the selected mode
             * @param error - existing errors
             * @return void.
             */
            function nextStep(isValid, error) {

                if (isValid) {
                    this.clearError();
                    this.stepUp();
                    this.setPageHeader();
                } else {
                    this.showError(error);
                }
            }

            /**
             * @description Decrements Wizard to previous step regardless of errors
             * @return void.
             */
            function backStep() {
                this.clearError();
                this.setDataTableChanged(false);
                this.stepDown();
                this.setPageHeader();
            }

            /**
             * @description From Edit mode, sets back to View mode, otherwise returns user to dynamic Object home
             * @return void.
             */
            function cancel() {
                if (this.mode === 'edit' && this.labels.sObjectNameNoNamespace === 'Batch_Template__c') {
                    this.clearError();
                    this.setDataTableChanged(false);
                    this.setMode('view');
                } else {
                    //navigate to record home
                    var homeEvent = $A.get('e.force:navigateToObjectHome');
                    var objectName = this.labels.sObjectName;
                    homeEvent.setParams({
                        'scope': objectName
                    });
                    homeEvent.fire();
                }
            }

            /**
             * @description Sets the mode, and notify all the
             *      _onMetadataUpdated listeners. Resets progressIndicator.
             * @param mode - string that is the selected mode
             * @return void.
             */
            function setMode(mode) {
                this.mode = mode;
                this.progressIndicatorStep = '1';
                this.onMetadataUpdated.notify();
            }

            /**
             * @description Sets attribute logging whether data table info has changed
             * @param status - boolean
             * @return void.
             */
            function setDataTableChanged(status) {
                this.dataTableChanged = status;
                // oncellchange seems to be broken, so we also set the view directly in the controller
                // this is just updating the model
                // still need to notify so the modal footer can be notified
                this.onMetadataUpdated.notify();
            }

            /**
             * @description Shows error message.
             * @param message - String for the error message
             * @return void.
             */
            function showError(message) {
                this.hasError = true;
                this.errorMessage = message;
                this.onMetadataUpdated.notify();
            }

            /**
             * @description Clears error message
             * @return void.
             */
            function clearError() {
                this.hasError = false;
                this.errorMessage = '';
                this.onMetadataUpdated.notify();
            }

            /**
             * @description sets the page header based on the step in the wizard
             * @return void.
             */
            function setPageHeader() {
                var headers = [this.labels.recordInfoLabel,
                    'Select Template',
                    $A.get('$Label.c.bgeBatchTemplateSelectFields'),
                    $A.get('$Label.c.bgeBatchTemplateSetFieldOptions'),
                    'Select Matching Rules'
                ];

                var progressIndicatorStepBase1 = parseInt(this.progressIndicatorStep) - 1;
                this.pageHeader = headers[progressIndicatorStepBase1];
                this.onMetadataUpdated.notify();
            }

            /**
             * @description Increments the step for the progressIndicator
             * @return void.
             */
            function stepUp() {
                var stepNum = parseInt(this.progressIndicatorStep);
                switch (stepNum) {
                    case 1:
                        // TODO: adjust this when we add in step 2
                        stepNum = 3;
                        break;
                    case 2:
                        stepNum = 3;
                        break;
                    case 3:
                        stepNum = 4;
                        break;
                    case 4:
                        stepNum = 5;
                        break;
                    default:
                        stepNum = 1;
                        break;
                }
                this.progressIndicatorStep = stepNum.toString();
                this.onMetadataUpdated.notify();
            }

            /**
             * @description Decrements the step for the progressIndicator
             * @return void.
             */
            function stepDown() {
                var stepNum = parseInt(this.progressIndicatorStep);
                switch (stepNum) {
                    case 2:
                        stepNum = 1;
                        break;
                    case 3:
                        // TODO: adjust this when we add in step 2
                        stepNum = 1;
                        break;
                    case 4:
                        stepNum = 3;
                        break;
                    case 5:
                        stepNum = 4;
                        break;
                    default:
                        stepNum = 1;
                        break;
                }
                this.progressIndicatorStep = stepNum.toString();
                this.onMetadataUpdated.notify();
            }

            // TemplateMetadata module public functions and properties
            return {
                labels: {},
                mode: '',
                progressIndicatorStep: '',
                hasError: false,
                errorMessage: '',
                dataTableChanged: false,
                pageHeader: '',
                load: load,
                reload: reload,
                nextStep: nextStep,
                backStep: backStep,
                cancel: cancel,
                setMode: setMode,
                showError: showError,
                clearError: clearError,
                setPageHeader: setPageHeader,
                stepUp: stepUp,
                stepDown: stepDown,
                onMetadataUpdated: _onMetadataUpdated,
                setDataTableChanged: setDataTableChanged
            }
        })(this.Event());
    },

    /**
     * @description. Publisher/Subscribers used by the Model modules
     *      to notify the View modules on a specific change.
     * @return Event
     */
    Event: function () {
        return function(sender) {
            var _sender = sender;
            var _listeners = [];
            
            /**
             * @description Subscribes the listener to the current Event.
             * @param listener. The event listener.
             * @return void.
             */
            function subscribe(listener) {
                _listeners.push(listener);
            }
            
            /**
             * @description Notifies the listeners of the current Event.
             * @param args. The parameters to provide to the listeners.
             * @return void.
             */
            function notify(args) {
                var index;
                for (index = 0; index < _listeners.length; index += 1) {
                    _listeners[index](_sender, args);
                }
            }
            
            // Event module public functions.
            return {
                subscribe: subscribe,
                notify: notify
            };
        };
    },
    
    /*********************************************** Template Detail Controller *********************************************/

    /**
     * @description Gets Template Details Controller
     * @return Template Details Controller.
     */
    BGETemplateController : function(component) {
        return (function (component) {
            var _component = component;

            /**
             * @description Calls the getRecordDetails method.
             * @param recordId. The Id of the Template.
             * @param callback. The callback function to execute.
             * @return void.
             */
            function getRecordDetails(sObjectName, recordId, callback) {
                var action = _component.get('c.getRecordDetails');
                action.setParams({
                    'sObjectName': sObjectName,
                    'recordId': recordId
                });
                action.setCallback(callback, _processResponse);
                $A.enqueueAction(action);
            }

            /**
             * @description Calls the saveRecord method.
             * @param templateDetails. The Template fields.
             * @param activeFields. The active fields (JSON format)
             * @param callback. The callback function to execute.
             * @return void.
             */
            function saveRecord(sObjectName, recordDetails, activeFields, callback) {
                var action = _component.get('c.saveRecord');
                action.setParams({
                    'sObjectName' : sObjectName,
                    'recordInfo': JSON.stringify(recordDetails),
                    'activeFields': JSON.stringify(activeFields)
                });
                action.setCallback(callback, _processResponse);
                $A.enqueueAction(action);
            }

            /**
             * @description Processes the response from any Apex method.
             * @param response. The response from the backend.
             * @return void.
             */
            function _processResponse(response) {
                var state = response.getState();
                if (state === 'SUCCESS') {
                    this.success(JSON.parse(response.getReturnValue()));
                }
                else if (state === 'ERROR') {
                    var errors = response.getError();
                    if (errors) {
                        if (errors[0] && errors[0].message) {
                            this.errors = errors[0].message;
                        }
                    } else {
                        this.errors = 'Unknown error';
                    }
                }
            }
            
            // BGETemplateController module public functions.
            return {
                errors: '',
                getRecordDetails: getRecordDetails,
                saveRecord: saveRecord
            }
        })(component);
    },
})