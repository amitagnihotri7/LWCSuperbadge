import { LightningElement, wire,api } from 'lwc';
import { updateRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
import getBoats from '@salesforce/apex/BoatDataService.getBoats';

//publish an event  -1st step 
import BOATMC from '@salesforce/messageChannel/BoatMessageChannel__c';

//LMS -2nd step
import {
    subscribe,
    APPLICATION_SCOPE,
    MessageContext,
    publish
} from 'lightning/messageService';

const SUCCESS_VARIANT = 'success';
const MESSAGE_SHIP_IT = 'Ship It!';
const SUCCESS_TITLE = 'Success';
const ERROR_TITLE = 'Error';
const ERROR_VARIANT = 'error';

export default class BoatSearchResults extends LightningElement {
    isLoading = false;
    boatTypeId = '';
    boats;
    selectedboatId = '';
    showSpinner = false;

    //LMS - 3rd Step
    @wire(MessageContext)
    messageContext;

    @wire(getBoats, { boatTypeId: '$boatTypeId' })
    wiredBoats(value) {
        // Hold on to the provisioned value so we can refresh it later.
        this.boats = value; // track the provisioned value
         if (value.error) { 
        }
        this.isLoading = false;
        this.notifyLoading(this.isLoading);
    }

    updateSelectedTile(event) {
        this.selectedboatId = event.detail.boatId;
        console.log('this.selectedboatId',this.selectedboatId);
        const payload = { recordId: this.selectedboatId };
        publish(this.messageContext, BOATMC, payload);
        console.log('this.selectedboatId-->',this.selectedboatId);
    }

    columns = [
        { label: 'Name', fieldName: 'Name', editable: true },
        { label: 'Length', fieldName: 'Length__c', type: 'number', editable: true },
        { label: 'Price', fieldName: 'Price__c', type: 'currency', editable: true },
        { label: 'Description', fieldName: 'Description__c', editable: true },
    ];

    handleSave(event) {
        console.log(event.detail.draftValues);
        const recordInputs = event.detail.draftValues.slice().map(draft => {
            const fields = Object.assign({}, draft);    // Object.assign({},draft) , means clone fields with draft values  
            return { fields };
        });
        console.log('recordInputs', recordInputs);   // Array of Fields with their keys 

        //uiRecordAPi to updateRecord returns Promise, we have multiple Selection Fields so for each selection it returns a promise
        const promises = recordInputs.map(recordInput => updateRecord(recordInput));

        //Promise.all -- take array of promises and return one promise 
        Promise.all(promises).then(records => {
            console.log('success');
            this.dispatchEvent(
                new ShowToastEvent({
                    title: SUCCESS_TITLE,
                    message: MESSAGE_SHIP_IT,
                    variant: SUCCESS_VARIANT
                }));
            // Clear all draft values
            this.draftValues = [];

            // Display fresh data in the datatable
            this.refresh();     //return refreshApex(this.boats);
        }).catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: ERROR_TITLE,
                    message: error,
                    variant: ERROR_VARIANT
                }));
        }).finally(() => { });
    }

    @api searchBoats(boatTypeId) { 
        console.log('searchBoats @api inside BoatSearchResults->',boatTypeId);
        this.isLoading = true;
        this.notifyLoading(this.isLoading);
        this.boatTypeId = boatTypeId;
        console.log('changed BotaID->',boatTypeId);
    }

    @api 
     async refresh() {
            this.isLoading = true;
            this.notifyLoading(this.isLoading);
             await refreshApex(this.boats)
            .then(() =>{ 
                this.isLoading = false;
                this.notifyLoading(this.isLoading);
            })
            .catch(() => {
                this.isLoading = false;
                this.notifyLoading(this.isLoading);
            });
    }

    // Check the current value of isLoading before dispatching the doneloading or loading custom event
    notifyLoading(isLoading) { 
        if(isLoading)
        {
            const clickEvt = new CustomEvent('loading');
            this.dispatchEvent(clickEvt);
        }
        else
        {
            const clickEvt = new CustomEvent('doneloading');
            this.dispatchEvent(clickEvt);
        }
    }
}   

/*import { LightningElement, wire, api, track } from 'lwc';
import getBoats from '@salesforce/apex/BoatDataService.getBoats';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { publish, MessageContext } from 'lightning/messageService';
import BoatMC from '@salesforce/messageChannel/BoatMessageChannel__c';

const SUCCESS_TITLE = 'Success';
const MESSAGE_SHIP_IT = 'Ship it!';
const SUCCESS_VARIANT = 'success';
const ERROR_TITLE = 'Error';
const ERROR_VARIANT = 'error';

export default class BoatSearchResults extends LightningElement {
    boatTypeId = '';
    @track boats;
    @track draftValues = [];
    selectedBoatId = '';
    isLoading = false;
    error = undefined;
    wiredBoatsResult;

    @wire(MessageContext) messageContext;

    columns = [
        { label: 'Name', fieldName: 'Name', type: 'text', editable: 'true'  },
        { label: 'Length', fieldName: 'Length__c', type: 'number', editable: 'true' },
        { label: 'Price', fieldName: 'Price__c', type: 'currency', editable: 'true' },
        { label: 'Description', fieldName: 'Description__c', type: 'text', editable: 'true' }
    ];

    @api
    searchBoats(boatTypeId) {
        this.isLoading = true;
        this.notifyLoading(this.isLoading);
        this.boatTypeId = boatTypeId;
    }

    @wire(getBoats, { boatTypeId: '$boatTypeId' })
    wiredBoats(result) {
        this.boats = result;
        if (result.error) {
            this.error = result.error;
            this.boats = undefined;
        }
        this.isLoading = false;
        this.notifyLoading(this.isLoading);
    }

    updateSelectedTile(event) {
        this.selectedBoatId = event.detail.boatId;
        this.sendMessageService(this.selectedBoatId);
    }

    handleSave(event) {
        this.notifyLoading(true);
       const recordInputs = event.detail.draftValues.slice().map(draft=>{
           const fields = Object.assign({}, draft);
           return {fields};
       });

       console.log(recordInputs);
       const promises = recordInputs.map(recordInput => updateRecord(recordInput));
       Promise.all(promises).then(res => {
           this.dispatchEvent(
               new ShowToastEvent({
                   title: SUCCESS_TITLE,
                   message: MESSAGE_SHIP_IT,
                   variant: SUCCESS_VARIANT
               })
           );
           this.draftValues = [];
           return this.refresh();
       }).catch(error => {
           this.error = error;
           this.dispatchEvent(
                new ShowToastEvent({
                    title: ERROR_TITLE,
                    message: 'Contact System Admin!',
                    variant: ERROR_VARIANT
                })
            );
            this.notifyLoading(false);
       }).finally(() => {
            this.draftValues = [];
        });
    }

    @api
    async refresh() {
        this.isLoading = true;
        this.notifyLoading(this.isLoading);      
        await refreshApex(this.boats);
        this.isLoading = false;
        this.notifyLoading(this.isLoading);        
    }


    notifyLoading(isLoading) {
        if (isLoading) {
            this.dispatchEvent(new CustomEvent('loading'));
        } else {
            this.dispatchEvent(CustomEvent('doneloading'));
        }
    }

     sendMessageService(boatId) { 
        publish(this.messageContext, BoatMC, { recordId : boatId });
    }
}*/