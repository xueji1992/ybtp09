sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
	'sap/ui/export/library',
	'sap/ui/export/Spreadsheet'
], function (BaseController, JSONModel, formatter, Filter, FilterOperator,exportLibrary, Spreadsheet) {
    "use strict";

    var EdmType = exportLibrary.EdmType;

    return BaseController.extend("ybtp092.controller.Worklist", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit : function () {
            var oViewModel;

            // keeps the search state
            this._aTableSearchState = [];

            // Model used to manipulate control states
            oViewModel = new JSONModel({
                worklistTableTitle : this.getResourceBundle().getText("worklistTableTitle"),
                shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
                shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
                tableNoDataText : this.getResourceBundle().getText("tableNoDataText")
            });
            this.setModel(oViewModel, "worklistView");

            /**占比树状图 */
            var cardManifests = new JSONModel();
            cardManifests.loadData(sap.ui.require.toUrl("ybtp092/model/cardManifests.json"));

            /*Fitler */
            
            this.getUserInfo();
            var barModel = new JSONModel();
			this.getView().setModel(cardManifests, "manifests");
            this.setModel(barModel, "barModel");
            this._filterArr = ["Bukrs","Gjahr", "Gukrs", "Monat","Budat"]
            var formModal = new JSONModel();
            this._filterArr.forEach(function(a){
              formModal.setProperty("/"+a, "");
            })
            
            this.setModel(formModal, "formModal");
            this._date = new Date();
            var user = this.getModel("userInfo");
            console.log(user, "user");
            formModal.setProperty("/Bukrs", "1000");
            formModal.setProperty("/Gjahr", this._date.getFullYear());
            this.getBukrs();
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Triggered by the table's 'updateFinished' event: after new table
         * data is available, this handler method updates the table counter.
         * This should only happen if the update was successful, which is
         * why this handler is attached to 'updateFinished' and not to the
         * table's list binding's 'dataReceived' method.
         * @param {sap.ui.base.Event} oEvent the update finished event
         * @public
         */
        onUpdateFinished : function (oEvent) {
            // update the worklist's object counter after the table update
            var sTitle,
                oTable = oEvent.getSource(),
                iTotalItems = oEvent.getParameter("total");
            // only update the counter if the length is final and
            // the table is not empty
            if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
                sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
            } else {
                sTitle = this.getResourceBundle().getText("worklistTableTitle");
            }
            this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
        },

        /**
         * Event handler when a table item gets pressed
         * @param {sap.ui.base.Event} oEvent the table selectionChange event
         * @public
         */
        onPress : function (oEvent) {
            // The source is the list item that got pressed
            this._showObject(oEvent.getSource());
        },

        /**
         * Event handler for navigating back.
         * Navigate back in the browser history
         * @public
         */
        onNavBack : function() {
            // eslint-disable-next-line sap-no-history-manipulation
            history.go(-1);
        },


        onSearch : function (oEvent) {
            if (oEvent.getParameters().refreshButtonPressed) {
                // Search field's 'refresh' button has been pressed.
                // This is visible if you select any main list item.
                // In this case no new search is triggered, we only
                // refresh the list binding.
                this.onRefresh();
            } else {
                var aTableSearchState = [];
                var sQuery = oEvent.getParameter("query");

                if (sQuery && sQuery.length > 0) {
                    aTableSearchState = [new Filter("CatalogDesc", FilterOperator.Contains, sQuery)];
                }
                this._applySearch(aTableSearchState);
            }

        },

        /**
         * Event handler for refresh event. Keeps filter, sort
         * and group settings and refreshes the list binding.
         * @public
         */
        onRefresh : function () {
            var oTable = this.byId("table");
            oTable.getBinding("items").refresh();
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Shows the selected item on the object page
         * @param {sap.m.ObjectListItem} oItem selected Item
         * @private
         */
        _showObject : function (oItem) {
            this.getRouter().navTo("object", {
                objectId: oItem.getBindingContext().getPath().substring("/ycdv_btp09".length)
            });
        },

        /**
         * Internal helper method to apply both filter and search state together on the list binding
         * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
         * @private
         */
        _applySearch: function(aTableSearchState) {
            var oTable = this.byId("table"),
                oViewModel = this.getModel("worklistView");
            oTable.getBinding("items").filter(aTableSearchState, "Application");
            // changes the noDataText of the list in case there are no filter results
            if (aTableSearchState.length !== 0) {
                oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
            }
        },



////////////////////////Filter 
        getBukrs: function () {
            var _this = this
            var sUrl = "/BASEINF_BUKRSSet";
            var oViewModel = _this.getView().getModel("barModel")
            var aFilters = [];
            var mParameters = {
              filters: aFilters,
              success: jQuery.proxy(function (oData) {
                var aResult = oData.results;
                oViewModel.setProperty("/Bukrss", aResult)
              //   console.log(aResult, 'aResult')
              }, this),
              error: jQuery.proxy(function (oData) {
                console.log(oData, 'oData')
              }, this)
            };
            this.getOwnerComponent().getModel("BASEINFO").read(sUrl, mParameters);
          },

          getUserInfo: function () {
              const url = this.getBaseURL() + "/user-api/currentUser";
              var oModel = new JSONModel();
              var mock = {
                  firstname: "Dummy",
                  lastname: "User",
                  email: "homiao@deloitte.com",
                  name: "homiao",
                  displayName: "homiao(homiao@deloitte.com)"
              }; 
              oModel.loadData(url);
              oModel.dataLoaded()
              .then(()=>{
                  //check if data has been loaded
                  //for local testing, set mock data
                  if (!oModel.getData().email) {
                      oModel.setData(mock);
                  }
                  this.getView().setModel(oModel, "userInfo");
              })
              .catch(()=>{               
                  oModel.setData(mock);
                  this.getView().setModel(oModel, "userInfo");
              });
          },      
          
          getBaseURL: function () {
              var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
              console.log("appId", appId)
              var appPath = appId.replaceAll(".", "/");
              var appModulePath = jQuery.sap.getModulePath(appPath);
              return appModulePath;
          },

          onExport: function() {
              var aCols, oRowBinding, oSettings, oSheet, oTable;
  
              if (!this._oTable) {
                  this._oTable = this.byId('table');
              }
  
              oTable = this._oTable;
              oRowBinding = oTable.getBinding('items');
              aCols = this.createColumnConfig();
  
              oSettings = {
                  workbook: {
                      columns: aCols,
                      hierarchyLevel: 'Level'
                  },
                  dataSource: oRowBinding,
                  fileName: '门店统计表.xlsx',
                  worker: false // We need to disable worker because we are using a MockServer as OData Service
              };
  
              oSheet = new Spreadsheet(oSettings);
              oSheet.build().finally(function() {
                  oSheet.destroy();
              });
          },

          createColumnConfig: function() {
              var aCols = [];

              aCols.push({
                label: 'Catalog Desc',
                type: EdmType.String,
                property: 'CatalogDesc',
                scale: 0
            });
            aCols.push({
              label: '年初数',
              type: EdmType.String,
              property: 'Nchymd',
              scale: 0
          });
          aCols.push({
              label: '1月',
              type: EdmType.Number,
              property: 'Period1',
              scale: 0
          });
          aCols.push({
              label: '2月',
              type: EdmType.Number,
              property: 'Period2',
              scale: 0
          });
          aCols.push({
              label: '3月',
              type: EdmType.Number,
              property: 'Period3',
              scale: 0
          });
  
            //   aCols.push({
            //       property: 'Firstname',
            //       type: EdmType.String
            //   });
  
            //   aCols.push({
            //       property: 'Lastname',
            //       type: EdmType.String
            //   });
  
            //   aCols.push({
            //       property: 'Birthdate',
            //       type: EdmType.Date
            //   });
  
            //   aCols.push({
            //       property: 'Salary',
            //       type: EdmType.Number,
            //       scale: 2,
            //       delimiter: true
            //   });
  
            //   aCols.push({
            //       property: 'Currency',
            //       type: EdmType.String
            //   });
  
            //   aCols.push({
            //       property: 'Active',
            //       type: EdmType.Boolean,
            //       trueValue: 'YES',
            //       falseValue: 'NO'
            //   });
  
              return aCols;
          }

    });
});
